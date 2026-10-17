import { Server } from "socket.io";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { resolveUserId } from "../middleware/auth.middleware.js";
import { allowedOrigins } from "../app.js";

/**
 * Realtime collaborative whiteboard.
 *
 * Consistency model
 * - The server owns the board. Every committed object gets a monotonically increasing `seq`, assigned
 *   in the single Node event loop, so there is exactly one global order. Clients render by `seq`, so all
 *   participants converge on the same picture even when strokes overlap in time.
 * - Writes are append / targeted-update operations. Clients never upload the whole board, so two people
 *   drawing at once can't overwrite each other (the old "save everything" design lost updates).
 * - Operations are idempotent by client-generated `id`, so a retry after a reconnect can't duplicate.
 * - Text objects are edited under an exclusive lock: only the holder may change them. Locks expire if the
 *   holder goes silent, and are released when their socket disconnects.
 * - Live stroke chunks are relayed (volatile, never stored) for low latency; the stroke's final commit
 *   carries the complete point list, so a dropped chunk can never corrupt the stored board.
 * - Persistence is debounced and serialised per room.
 * - Call presence (who is in the video call) is tracked here so the other participant can be told to join.
 */

const MAX_ITEMS = 4000;
const MAX_POINTS = 20000; // numbers per stroke (x,y pairs)
const MAX_TEXT = 4000;
const LOCK_TTL_MS = 20_000;
const SAVE_DEBOUNCE_MS = 800;
const BOARD_W = 800;
const BOARD_H = 600;

/** @type {Map<string, Board>} */
const boards = new Map();
let io = null;

const roomKey = (roomId) => `wb:${roomId}`;

const num = (v, lo, hi, d) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const colour = (v) => (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : "#1a1814");

class Board {
  constructor(roomId, participants, items) {
    this.roomId = roomId;
    this.call = new Map(); // socketId -> { userId, name }
    this.present = new Map(); // socketId -> { userId, name }: who currently has the room open
    this.participants = new Set(participants);
    this.items = items;
    this.byId = new Map(items.map((i) => [i.id, i]));
    this.seq = items.reduce((m, i) => Math.max(m, i.seq || 0), 0) + 1;
    this.locks = new Map(); // textId -> { userId, name, socketId, expires }
    this.dirty = false;
    this.saving = false;
    this.timer = null;
  }

  nextSeq() {
    return this.seq++;
  }

  markDirty() {
    this.dirty = true;
    if (this.timer || this.saving) return;
    this.timer = setTimeout(() => this.flush(), SAVE_DEBOUNCE_MS);
  }

  async flush() {
    this.timer = null;
    if (this.saving) return;
    this.saving = true;
    try {
      while (this.dirty) {
        this.dirty = false;
        await Room.updateOne({ roomId: this.roomId }, { $set: { "canvasData.items": this.items } });
      }
    } catch (error) {
      this.dirty = true;
      console.error("[WHITEBOARD] Save failed:", error.message);
      this.timer = setTimeout(() => this.flush(), 3000);
    } finally {
      this.saving = false;
    }
  }
}

/** Convert pre-realtime saved strokes into board items. */
const migrateLegacy = (strokes = []) =>
  strokes.map((s, i) => ({
    id: `legacy-${i}`,
    kind: s.type === "erase" ? "erase" : "stroke",
    points: s.points || [],
    color: s.color || "#1a1814",
    width: s.width || 3,
    seq: i + 1,
    by: null
  }));

const loadBoard = async (roomId) => {
  const existing = boards.get(roomId);
  if (existing) return existing;

  const room = await Room.findOne({ roomId }).lean();
  if (!room) return null;

  const saved = room.canvasData?.items;
  const items = saved?.length ? saved : migrateLegacy(room.canvasData?.strokes);
  // Another socket may have loaded the same room while we awaited the DB.
  if (boards.has(roomId)) return boards.get(roomId);

  const board = new Board(roomId, room.participants.map(String), items);
  board.active = room.active;
  boards.set(roomId, board);
  return board;
};

/** Current board for REST reads (late joiners, page refresh); falls back to the database. */
export const getBoardItems = async (roomId) => {
  const board = await loadBoard(roomId);
  return board ? board.items : null;
};

/** Persist and forget a board when its room closes. */
export const closeBoard = async (roomId) => {
  const board = boards.get(roomId);
  if (!board) return;
  if (board.timer) clearTimeout(board.timer);
  board.dirty = true;
  await board.flush();
  boards.delete(roomId);
  io?.in(roomKey(roomId)).disconnectSockets(true);
};

/* ------------------------------ validation ------------------------------ */

const cleanPoints = (pts) => {
  if (!Array.isArray(pts) || pts.length < 2 || pts.length > MAX_POINTS) return null;
  const out = new Array(pts.length - (pts.length % 2));
  for (let i = 0; i < out.length; i += 2) {
    out[i] = Math.round(num(pts[i], 0, BOARD_W, 0) * 10) / 10;
    out[i + 1] = Math.round(num(pts[i + 1], 0, BOARD_H, 0) * 10) / 10;
  }
  return out;
};

const uniqueUsers = (sockets) => {
  const seen = new Map();
  for (const u of sockets.values()) seen.set(u.userId, u.name);
  return [...seen].map(([id, name]) => ({ id, name }));
};
const callUsers = (board) => uniqueUsers(board.call);
/** People with the room open right now (a user with two tabs counts once, and stays until both close). */
const presenceUsers = (board) => uniqueUsers(board.present);

/* ------------------------------ locks ------------------------------ */

const releaseLock = (board, textId, { silent = false } = {}) => {
  const lock = board.locks.get(textId);
  if (!lock) return;
  board.locks.delete(textId);

  const item = board.byId.get(textId);
  // A text object left empty is just a click that never turned into writing.
  if (item && item.kind === "text" && !item.text.trim()) {
    board.items.splice(board.items.indexOf(item), 1);
    board.byId.delete(textId);
    board.markDirty();
    io.in(roomKey(board.roomId)).emit("op:remove", { id: textId });
  }
  if (!silent) io.in(roomKey(board.roomId)).emit("lock:release", { id: textId });
};

const sweepLocks = () => {
  const now = Date.now();
  for (const board of boards.values()) {
    for (const [textId, lock] of board.locks) {
      if (lock.expires < now) {
        releaseLock(board, textId);
        io.to(lock.socketId).emit("lock:lost", { id: textId });
      }
    }
  }
};

/* ------------------------------ socket server ------------------------------ */

export const initializeWhiteboard = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
    maxHttpBufferSize: 2e6,
    pingInterval: 10_000,
    pingTimeout: 15_000
  });

  io.use(async (socket, next) => {
    const userId = await resolveUserId(socket.handshake.auth?.token);
    if (!userId) return next(new Error("unauthorized"));
    socket.data.userId = userId;
    next();
  });

  setInterval(sweepLocks, 5000).unref();

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    /** @type {Board | null} */
    let board = null;

    /** Wrap a handler so a malformed payload or a missing ack callback can never crash the process. */
    const on = (event, handler, { needsBoard = true } = {}) =>
      socket.on(event, async (payload, ack) => {
        const reply = typeof ack === "function" ? ack : () => {};
        try {
          if (needsBoard && !board) return reply({ ok: false, error: "not-joined" });
          if (!payload || typeof payload !== "object") payload = {};
          await handler(payload, reply);
        } catch (error) {
          console.error(`[WHITEBOARD] ${event} failed:`, error.message);
          reply({ ok: false, error: "server-error" });
        }
      });

    const room = () => roomKey(board.roomId);

    on(
      "join",
      async ({ roomId }, reply) => {
        const target = await loadBoard(str(roomId, 100));
        if (!target || target.active === false || !target.participants.has(userId)) {
          return reply({ ok: false, error: "forbidden" });
        }
        if (board && board !== target) socket.leave(roomKey(board.roomId));
        board = target;
        socket.join(room());

        const me = await User.findById(userId).select("displayName username").lean();
        socket.data.name = me?.displayName || me?.username || "Someone";

        board.present.set(socket.id, { userId, name: socket.data.name });
        io.in(room()).emit("presence:state", { users: presenceUsers(board) });

        const locks = [...board.locks].map(([id, l]) => ({ id, userId: l.userId, name: l.name }));
        reply({ ok: true, items: board.items, locks, userId, name: socket.data.name, callUsers: callUsers(board), presenceUsers: presenceUsers(board) });
      },
      { needsBoard: false }
    );

    // Live, ephemeral stroke segments. Volatile: dropping one is harmless because `stroke:commit` is complete.
    on("stroke:chunk", (p) => {
      const pts = cleanPoints(p.pts);
      if (!pts || typeof p.id !== "string" || p.id.length > 64) return;
      socket.to(room()).volatile.emit("stroke:chunk", {
        id: p.id,
        by: userId,
        kind: p.kind === "erase" ? "erase" : "stroke",
        color: colour(p.color),
        width: num(p.width, 1, 40, 3),
        start: !!p.start,
        pts
      });
    });

    on("stroke:commit", (p, reply) => {
      const points = cleanPoints(p.points);
      if (!points || typeof p.id !== "string" || p.id.length > 64) return reply({ ok: false, error: "invalid" });

      const dup = board.byId.get(p.id);
      if (dup) return reply({ ok: true, seq: dup.seq }); // retry after reconnect
      if (board.items.length >= MAX_ITEMS) return reply({ ok: false, error: "board-full" });

      const item = {
        id: p.id,
        kind: p.kind === "erase" ? "erase" : "stroke",
        points,
        color: colour(p.color),
        width: num(p.width, 1, 40, 3),
        seq: board.nextSeq(),
        by: userId
      };
      board.items.push(item);
      board.byId.set(item.id, item);
      board.markDirty();

      socket.to(room()).emit("op:add", item);
      reply({ ok: true, seq: item.seq });
    });

    on("text:create", (p, reply) => {
      if (typeof p.id !== "string" || p.id.length > 64) return reply({ ok: false, error: "invalid" });
      const dup = board.byId.get(p.id);
      if (dup) return reply({ ok: true, seq: dup.seq });
      if (board.items.length >= MAX_ITEMS) return reply({ ok: false, error: "board-full" });

      const item = {
        id: p.id,
        kind: "text",
        x: num(p.x, 0, BOARD_W, 0),
        y: num(p.y, 0, BOARD_H, 0),
        text: str(p.text, MAX_TEXT),
        color: colour(p.color),
        size: num(p.size, 8, 96, 20),
        seq: board.nextSeq(),
        by: userId
      };
      board.items.push(item);
      board.byId.set(item.id, item);
      board.locks.set(item.id, { userId, name: socket.data.name, socketId: socket.id, expires: Date.now() + LOCK_TTL_MS });
      board.markDirty();

      socket.to(room()).emit("op:add", item);
      socket.to(room()).emit("lock:acquire", { id: item.id, userId, name: socket.data.name });
      reply({ ok: true, seq: item.seq });
    });

    on("text:lock", ({ id }, reply) => {
      const item = board.byId.get(id);
      if (!item || item.kind !== "text") return reply({ ok: false, error: "gone" });

      const held = board.locks.get(id);
      if (held && held.userId !== userId && held.expires > Date.now()) {
        return reply({ ok: false, error: "locked", by: held.name });
      }
      board.locks.set(id, { userId, name: socket.data.name, socketId: socket.id, expires: Date.now() + LOCK_TTL_MS });
      socket.to(room()).emit("lock:acquire", { id, userId, name: socket.data.name });
      reply({ ok: true, item });
    });

    on("text:update", (p, reply) => {
      const item = board.byId.get(p.id);
      const lock = board.locks.get(p.id);
      if (!item || item.kind !== "text") return reply({ ok: false, error: "gone" });
      if (!lock || lock.userId !== userId) return reply({ ok: false, error: "not-locked" });

      lock.expires = Date.now() + LOCK_TTL_MS;
      lock.socketId = socket.id;
      if (typeof p.text === "string") item.text = str(p.text, MAX_TEXT);
      if (Number.isFinite(p.x)) item.x = num(p.x, 0, BOARD_W, item.x);
      if (Number.isFinite(p.y)) item.y = num(p.y, 0, BOARD_H, item.y);
      if (Number.isFinite(p.size)) item.size = num(p.size, 8, 96, item.size);
      if (typeof p.color === "string") item.color = colour(p.color);
      board.markDirty();

      socket.to(room()).emit("op:update", { id: item.id, text: item.text, x: item.x, y: item.y, size: item.size, color: item.color });
      reply({ ok: true });
    });

    on("text:release", ({ id }, reply) => {
      const lock = board.locks.get(id);
      if (lock && lock.userId === userId) releaseLock(board, id);
      reply({ ok: true });
    });

    /* ---- video call presence ---- */

    const broadcastCall = () => io.in(room()).emit("call:state", { users: callUsers(board) });
    on("call:join", (_p, reply) => {
      board.call.set(socket.id, { userId, name: socket.data.name });
      broadcastCall();
      reply({ ok: true });
    });
    on("call:leave", (_p, reply) => {
      board.call.delete(socket.id);
      broadcastCall();
      reply({ ok: true });
    });

    on("clear", (_p, reply) => {
      board.items.length = 0;
      board.byId.clear();
      board.locks.clear();
      board.markDirty();
      io.in(room()).emit("op:clear", { by: userId });
      reply({ ok: true });
    });

    socket.on("disconnect", () => {
      if (!board) return;
      if (board.call.delete(socket.id)) io.in(room()).emit("call:state", { users: callUsers(board) });
      if (board.present.delete(socket.id)) io.in(room()).emit("presence:state", { users: presenceUsers(board) });
      for (const [textId, lock] of board.locks) {
        if (lock.socketId === socket.id) releaseLock(board, textId);
      }
    });
  });

  console.log("✅ Whiteboard socket server ready");
  return io;
};
