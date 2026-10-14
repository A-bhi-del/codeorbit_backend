export const getResources = () => {
  return {
    resources: [
      // DSA Sheets
      {
        _id: "1",
        name: "Striver's A2Z DSA Course",
        description: "Complete DSA roadmap from basics to advanced with 400+ problems covering all topics systematically.",
        url: "https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z",
        category: "DSA Sheet",
        difficulty: "Beginner",
        problems: 400
      },
      {
        _id: "2",
        name: "Blind 75",
        description: "Curated list of 75 most important LeetCode problems for interview preparation.",
        url: "https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions",
        category: "DSA Sheet",
        difficulty: "Intermediate",
        problems: 75
      },
      {
        _id: "3",
        name: "NeetCode 150",
        description: "Extended version of Blind 75 with 150 problems covering all important patterns.",
        url: "https://neetcode.io/practice",
        category: "DSA Sheet",
        difficulty: "Intermediate",
        problems: 150
      },
      {
        _id: "4",
        name: "LeetCode Top Interview Questions",
        description: "Most frequently asked interview questions from top tech companies.",
        url: "https://leetcode.com/problemset/top-interview-questions/",
        category: "Interview Prep",
        difficulty: "Intermediate",
        problems: 145
      },
      {
        _id: "5",
        name: "Love Babbar DSA Sheet",
        description: "450 DSA questions covering all important topics for placements and interviews.",
        url: "https://www.geeksforgeeks.org/dsa-sheet-by-love-babbar/",
        category: "DSA Sheet",
        difficulty: "Beginner",
        problems: 450
      },
      {
        _id: "6",
        name: "Grind 75",
        description: "Customizable study plan with 75 problems, organized by difficulty and topic.",
        url: "https://www.techinterviewhandbook.org/grind75",
        category: "DSA Sheet",
        difficulty: "Intermediate",
        problems: 75
      },
      // System Design
      {
        _id: "7",
        name: "System Design Primer",
        description: "Learn how to design large-scale systems. Comprehensive guide with examples and diagrams.",
        url: "https://github.com/donnemartin/system-design-primer",
        category: "System Design",
        difficulty: "Advanced",
        problems: 0
      },
      {
        _id: "8",
        name: "Grokking System Design",
        description: "Interactive course covering system design fundamentals and real-world examples.",
        url: "https://www.educative.io/courses/grokking-the-system-design-interview",
        category: "System Design",
        difficulty: "Advanced",
        problems: 0
      },
      {
        _id: "9",
        name: "ByteByteGo System Design",
        description: "Visual system design explanations and interview preparation resources.",
        url: "https://bytebytego.com/",
        category: "System Design",
        difficulty: "Advanced",
        problems: 0
      },
      // Interview Prep
      {
        _id: "10",
        name: "GFG Interview Preparation",
        description: "Complete interview preparation guide covering DSA, CS fundamentals, and aptitude.",
        url: "https://www.geeksforgeeks.org/interview-preparation-for-software-developer/",
        category: "Interview Prep",
        difficulty: "Intermediate",
        problems: 200
      },
      {
        _id: "11",
        name: "Tech Interview Handbook",
        description: "Free curated interview preparation materials for busy engineers.",
        url: "https://www.techinterviewhandbook.org/",
        category: "Interview Prep",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "12",
        name: "Coding Interview University",
        description: "Multi-month study plan for becoming a software engineer at a large company.",
        url: "https://github.com/jwasham/coding-interview-university",
        category: "Interview Prep",
        difficulty: "Advanced",
        problems: 0
      },
      // More free, public resources
      {
        _id: "13",
        name: "Striver's SDE Sheet",
        description: "The 180-problem sheet most placement preparation is built around, grouped by topic with video explanations.",
        url: "https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/",
        category: "DSA Sheet",
        difficulty: "Intermediate",
        problems: 180
      },
      {
        _id: "14",
        name: "NeetCode Roadmap",
        description: "A visual roadmap of DSA topics in a sensible order, each linked to problems and a video walkthrough.",
        url: "https://neetcode.io/roadmap",
        category: "DSA Sheet",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "15",
        name: "Sean Prashad's LeetCode Patterns",
        description: "LeetCode problems grouped by the pattern they teach, in a suggested order.",
        url: "https://seanprashad.com/leetcode-patterns/",
        category: "DSA Sheet",
        difficulty: "Intermediate",
        problems: 170
      },
      {
        _id: "16",
        name: "CSES Problem Set",
        description: "300 carefully chosen algorithm problems, the standard training set for competitive programming.",
        url: "https://cses.fi/problemset/",
        category: "DSA Sheet",
        difficulty: "Intermediate",
        problems: 300
      },
      {
        _id: "17",
        name: "Algomonster",
        description: "Pattern-first DSA lessons with a flowchart for deciding which technique a problem needs.",
        url: "https://algo.monster/",
        category: "DSA Sheet",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "18",
        name: "VisuAlgo",
        description: "Animated visualisations of data structures and algorithms, step by step, with your own input.",
        url: "https://visualgo.net/en",
        category: "Visualisers & Reference",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "19",
        name: "Data Structure Visualizations (USFCA)",
        description: "Interactive animations for trees, heaps, hashing, sorting and graph algorithms.",
        url: "https://www.cs.usfca.edu/~galles/visualization/Algorithms.html",
        category: "Visualisers & Reference",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "20",
        name: "Big-O Cheat Sheet",
        description: "Time and space complexity of common data structures and sorting algorithms on one page.",
        url: "https://www.bigocheatsheet.com/",
        category: "Visualisers & Reference",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "21",
        name: "cppreference",
        description: "The reference for C and C++ standard libraries, containers and algorithms.",
        url: "https://en.cppreference.com/w/",
        category: "Visualisers & Reference",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "22",
        name: "Python Tutor",
        description: "Run code and watch memory, variables and call stacks change line by line.",
        url: "https://pythontutor.com/",
        category: "Visualisers & Reference",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "23",
        name: "USACO Guide",
        description: "A free, structured path from Bronze to Platinum with editorials and practice problems.",
        url: "https://usaco.guide/",
        category: "Competitive Programming",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "24",
        name: "CP-Algorithms",
        description: "Clear explanations and implementations of hundreds of competitive programming algorithms.",
        url: "https://cp-algorithms.com/",
        category: "Competitive Programming",
        difficulty: "Advanced",
        problems: 0
      },
      {
        _id: "25",
        name: "Codeforces EDU",
        description: "Video lectures and practice for segment trees, binary search, two pointers and more, by Codeforces.",
        url: "https://codeforces.com/edu/courses",
        category: "Competitive Programming",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "26",
        name: "AtCoder Problems",
        description: "Browse AtCoder problems by difficulty and track your progress, with a recommended practice list.",
        url: "https://kenkoooo.com/atcoder/",
        category: "Competitive Programming",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "27",
        name: "Competitive Programmer's Handbook",
        description: "A free book by Antti Laaksonen covering the techniques used in contests.",
        url: "https://cses.fi/book/book.pdf",
        category: "Competitive Programming",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "28",
        name: "Harvard CS50",
        description: "Harvard's introduction to computer science, free with lectures, problem sets and a certificate option.",
        url: "https://cs50.harvard.edu/x/",
        category: "Courses",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "29",
        name: "MIT 6.006 Introduction to Algorithms",
        description: "MIT's algorithms course with full lectures, notes and problem sets on OpenCourseWare.",
        url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
        category: "Courses",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "30",
        name: "Stanford Algorithms Specialization (Roughgarden)",
        description: "Free algorithms lectures by Tim Roughgarden covering divide and conquer, graphs and dynamic programming.",
        url: "https://www.youtube.com/playlist?list=PLXFMmlk03Dt7Q0xr1PIAriY5623cKiH7V",
        category: "Courses",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "31",
        name: "freeCodeCamp",
        description: "Free full-length courses and certifications on web development, Python, data and more.",
        url: "https://www.freecodecamp.org/learn",
        category: "Courses",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "32",
        name: "The Missing Semester of Your CS Education",
        description: "MIT's course on the tools nobody teaches: shell, git, editors, debugging and profiling.",
        url: "https://missing.csail.mit.edu/",
        category: "Courses",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "33",
        name: "Operating Systems: Three Easy Pieces",
        description: "A free, very readable operating systems book covering virtualisation, concurrency and persistence.",
        url: "https://pages.cs.wisc.edu/~remzi/OSTEP/",
        category: "CS Fundamentals",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "34",
        name: "CMU Database Systems (15-445)",
        description: "Andy Pavlo's database internals course with all lectures on YouTube.",
        url: "https://15445.courses.cs.cmu.edu/",
        category: "SQL & Databases",
        difficulty: "Advanced",
        problems: 0
      },
      {
        _id: "35",
        name: "Computer Networking: A Top-Down Approach",
        description: "Companion site with lecture slides and interactive material for the classic networking textbook.",
        url: "https://gaia.cs.umass.edu/kurose_ross/index.php",
        category: "CS Fundamentals",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "36",
        name: "Beej's Guide to Network Programming",
        description: "A friendly, free guide to sockets and how networked programs actually talk to each other.",
        url: "https://beej.us/guide/bgnet/",
        category: "CS Fundamentals",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "38",
        name: "Crash Course Computer Science",
        description: "Short, clear videos on how computers work, from logic gates to operating systems.",
        url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo",
        category: "CS Fundamentals",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "39",
        name: "MDN Web Docs",
        description: "The reference for HTML, CSS and JavaScript, with guides and interactive examples.",
        url: "https://developer.mozilla.org/en-US/docs/Learn",
        category: "Web Development",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "40",
        name: "roadmap.sh",
        description: "Step-by-step learning roadmaps for frontend, backend, DevOps, system design and more.",
        url: "https://roadmap.sh/",
        category: "Web Development",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "41",
        name: "javascript.info",
        description: "A modern JavaScript tutorial from the basics to advanced topics, with exercises.",
        url: "https://javascript.info/",
        category: "Web Development",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "42",
        name: "React Documentation",
        description: "The official React docs: a hands-on tutorial and clear explanations of how React thinks.",
        url: "https://react.dev/learn",
        category: "Web Development",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "43",
        name: "The Odin Project",
        description: "A free, project-based full-stack curriculum with a community behind it.",
        url: "https://www.theodinproject.com/",
        category: "Web Development",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "44",
        name: "Node.js Learn",
        description: "Official guides to Node.js: the event loop, streams, file system and testing.",
        url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",
        category: "Web Development",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "45",
        name: "web.dev Learn",
        description: "Google's free courses on CSS, accessibility, performance and responsive design.",
        url: "https://web.dev/learn",
        category: "Web Development",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "46",
        name: "Refactoring Guru: Design Patterns",
        description: "Every classic design pattern explained with diagrams, examples and when not to use it.",
        url: "https://refactoring.guru/design-patterns",
        category: "Design & OOP",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "47",
        name: "Awesome Low Level Design",
        description: "A collection of low-level design problems and solutions often asked in interviews.",
        url: "https://github.com/ashishps1/awesome-low-level-design",
        category: "Design & OOP",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "48",
        name: "The Algorithms",
        description: "Open-source implementations of algorithms and data structures in many languages.",
        url: "https://the-algorithms.com/",
        category: "Visualisers & Reference",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "49",
        name: "Pro Git",
        description: "The official Git book, free online, from basic commits to internals.",
        url: "https://git-scm.com/book/en/v2",
        category: "Dev Tools",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "50",
        name: "Learn Git Branching",
        description: "An interactive game that teaches git branching, merging and rebasing visually.",
        url: "https://learngitbranching.js.org/",
        category: "Dev Tools",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "51",
        name: "explainshell",
        description: "Paste a shell command and see what every part of it means.",
        url: "https://explainshell.com/",
        category: "Dev Tools",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "52",
        name: "First Contributions",
        description: "A guided, hands-on way to make your first open-source pull request.",
        url: "https://github.com/firstcontributions/first-contributions",
        category: "Open Source",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "53",
        name: "Good First Issue",
        description: "Find beginner-friendly issues in popular open-source projects.",
        url: "https://goodfirstissue.dev/",
        category: "Open Source",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "54",
        name: "Up For Grabs",
        description: "Projects with tasks marked as friendly to new contributors, searchable by language.",
        url: "https://up-for-grabs.net/",
        category: "Open Source",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "55",
        name: "Google Machine Learning Crash Course",
        description: "A fast, practical introduction to machine learning with exercises.",
        url: "https://developers.google.com/machine-learning/crash-course",
        category: "AI & ML",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "56",
        name: "fast.ai Practical Deep Learning",
        description: "A free, code-first course that gets you training real models quickly.",
        url: "https://course.fast.ai/",
        category: "AI & ML",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "57",
        name: "Hugging Face Courses",
        description: "Free courses on transformers, NLP and building with open models.",
        url: "https://huggingface.co/learn",
        category: "AI & ML",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "58",
        name: "3Blue1Brown: Neural Networks",
        description: "A visual explanation of how neural networks and backpropagation work.",
        url: "https://www.3blue1brown.com/topics/neural-networks",
        category: "AI & ML",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "59",
        name: "HackerRank",
        description: "Practice problems, language tracks and interview prep kits with instant feedback.",
        url: "https://www.hackerrank.com/domains/tutorials/10-days-of-javascript",
        category: "Practice Platforms",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "60",
        name: "Exercism",
        description: "Free practice in 70+ languages with optional mentoring.",
        url: "https://exercism.org/tracks",
        category: "Practice Platforms",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "61",
        name: "Codewars",
        description: "Small coding challenges (kata) that you solve and compare with other people's solutions.",
        url: "https://www.codewars.com/",
        category: "Practice Platforms",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "62",
        name: "InterviewBit",
        description: "A structured interview preparation path with timed problems and company tags.",
        url: "https://www.interviewbit.com/courses/programming/",
        category: "Practice Platforms",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "63",
        name: "Project Euler",
        description: "Mathematical and programming puzzles that reward efficient algorithms.",
        url: "https://projecteuler.net/",
        category: "Practice Platforms",
        difficulty: "Advanced",
        problems: 0
      },
      {
        _id: "64",
        name: "SQLBolt",
        description: "Short interactive SQL lessons that run in your browser.",
        url: "https://sqlbolt.com/",
        category: "SQL & Databases",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "65",
        name: "LeetCode SQL 50",
        description: "A curated set of 50 SQL problems that covers what interviews test.",
        url: "https://leetcode.com/studyplan/top-sql-50/",
        category: "SQL & Databases",
        difficulty: "Intermediate",
        problems: 50
      },
      {
        _id: "66",
        name: "Pramp",
        description: "Free live mock interviews with other candidates, covering coding and system design.",
        url: "https://www.pramp.com/",
        category: "Interview Prep",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "67",
        name: "Interviewing.io Guides",
        description: "Free guides and anonymised interview transcripts from engineers at top companies.",
        url: "https://interviewing.io/guides",
        category: "Interview Prep",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "68",
        name: "Cracking the Coding Interview (resources)",
        description: "Gayle Laakmann McDowell's site with the book's approach, templates and extra practice.",
        url: "https://www.crackingthecodinginterview.com/",
        category: "Interview Prep",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "69",
        name: "Levels.fyi Salary and Levels",
        description: "Compare pay and levels across companies before an offer negotiation.",
        url: "https://www.levels.fyi/",
        category: "Interview Prep",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "70",
        name: "High Scalability",
        description: "Real architecture write-ups from companies that run large systems.",
        url: "https://highscalability.com/",
        category: "System Design",
        difficulty: "Advanced",
        problems: 0
      },
      {
        _id: "71",
        name: "Designing Data-Intensive Applications (companion notes)",
        description: "A free reading guide to the book most system design interviews are built around.",
        url: "https://dataintensive.net/",
        category: "System Design",
        difficulty: "Advanced",
        problems: 0
      },
      {
        _id: "72",
        name: "Awesome System Design",
        description: "A curated list of system design learning material, case studies and talks.",
        url: "https://github.com/madd86/awesome-system-design",
        category: "System Design",
        difficulty: "Advanced",
        problems: 0
      },
      // CS courses, GitHub and SQL resources
      {
        _id: "73",
        name: "CS50's Introduction to Programming with Python",
        description: "Harvard's gentle first programming course in Python, with short lectures and problem sets.",
        url: "https://cs50.harvard.edu/python/",
        category: "Courses",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "74",
        name: "Teach Yourself Computer Science",
        description: "A short, opinionated guide to the best free book or course for each core CS subject.",
        url: "https://teachyourselfcs.com/",
        category: "Courses",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "75",
        name: "OSSU Computer Science",
        description: "A complete, free computer science curriculum built from the best online university courses.",
        url: "https://github.com/ossu/computer-science",
        category: "Courses",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "76",
        name: "MIT 6.0001 Introduction to Computer Science and Programming in Python",
        description: "MIT's intro course with lectures, notes and problem sets on OpenCourseWare.",
        url: "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/",
        category: "Courses",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "77",
        name: "Princeton Algorithms (Sedgewick & Wayne)",
        description: "The companion site for the Algorithms textbook, with lecture slides, code and exercises.",
        url: "https://algs4.cs.princeton.edu/home/",
        category: "Courses",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "78",
        name: "Berkeley CS61A",
        description: "Structure and Interpretation of Computer Programs: how to think about programs, with full lecture videos.",
        url: "https://cs61a.org/",
        category: "Courses",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "79",
        name: "Khan Academy Computer Science",
        description: "Gentle video lessons on algorithms, the internet, cryptography and programming basics.",
        url: "https://www.khanacademy.org/computing/computer-science",
        category: "Courses",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "80",
        name: "MIT 6.042J Mathematics for Computer Science",
        description: "Discrete maths for CS: proofs, graphs, counting and probability, with free lectures and a free textbook.",
        url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/",
        category: "Courses",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "81",
        name: "CS50 Introduction to Computer Science (video playlist)",
        description: "The full CS50 lecture series on YouTube, from C to web development.",
        url: "https://www.youtube.com/playlist?list=PLhQjrBD2T382_R182iC2gNZI9HzWFMC_8",
        category: "Courses",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "82",
        name: "Free Programming Books",
        description: "A huge community list of free books, courses and interactive tutorials in many languages.",
        url: "https://github.com/EbookFoundation/free-programming-books",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "83",
        name: "Project-Based Learning",
        description: "A list of tutorials that teach programming by building real projects, grouped by language.",
        url: "https://github.com/practical-tutorials/project-based-learning",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "84",
        name: "You Don't Know JS Yet",
        description: "A free book series that goes deep into how JavaScript actually works.",
        url: "https://github.com/getify/You-Dont-Know-JS",
        category: "GitHub Resources",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "85",
        name: "30 Seconds of Code",
        description: "Short, useful JavaScript snippets you can read and learn from in half a minute each.",
        url: "https://www.30secondsofcode.org/",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "86",
        name: "JavaScript Algorithms and Data Structures",
        description: "Algorithms and data structures in JavaScript, each with a short explanation and links to learn more.",
        url: "https://github.com/trekhleb/javascript-algorithms",
        category: "GitHub Resources",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "87",
        name: "Awesome Interview Questions",
        description: "A curated list of interview questions grouped by language and technology.",
        url: "https://github.com/DopplerHQ/awesome-interview-questions",
        category: "GitHub Resources",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "88",
        name: "Awesome",
        description: "The master list of curated lists on GitHub: pick any topic and find the best resources for it.",
        url: "https://github.com/sindresorhus/awesome",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "89",
        name: "The Algorithms (Python)",
        description: "Readable Python implementations of hundreds of algorithms, good for reading alongside a course.",
        url: "https://github.com/TheAlgorithms/Python",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "90",
        name: "GitHub Skills",
        description: "Short interactive courses that run inside GitHub itself: pull requests, Actions, Pages and more.",
        url: "https://skills.github.com/",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "91",
        name: "GitHub Docs: Hello World",
        description: "The official five-minute guide to repositories, branches, commits and pull requests.",
        url: "https://docs.github.com/en/get-started/start-your-journey/hello-world",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "92",
        name: "Open Source Guides",
        description: "GitHub's guides to finding, joining and contributing to open-source projects.",
        url: "https://opensource.guide/",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "93",
        name: "GitHub Student Developer Pack",
        description: "Free tools and credits for students, including Copilot and developer services.",
        url: "https://education.github.com/pack",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "94",
        name: "Oh My Git!",
        description: "An open-source game that teaches git by letting you play with commits and branches.",
        url: "https://ohmygit.org/",
        category: "GitHub Resources",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "95",
        name: "SQLZoo",
        description: "Interactive SQL tutorials with exercises that run in the browser, from SELECT to joins and subqueries.",
        url: "https://sqlzoo.net/wiki/SQL_Tutorial",
        category: "SQL & Databases",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "96",
        name: "Mode SQL Tutorial",
        description: "A clear SQL tutorial from basics to window functions, with a real data set to query.",
        url: "https://mode.com/sql-tutorial/",
        category: "SQL & Databases",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "97",
        name: "W3Schools SQL Tutorial",
        description: "Quick SQL reference and try-it-yourself examples for every common statement.",
        url: "https://www.w3schools.com/sql/",
        category: "SQL & Databases",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "98",
        name: "PostgreSQL Tutorial",
        description: "Step-by-step PostgreSQL lessons: queries, joins, indexes, functions and administration.",
        url: "https://www.postgresqltutorial.com/",
        category: "SQL & Databases",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "99",
        name: "PostgreSQL Exercises",
        description: "Practice SQL queries on a small data set, with answers and discussion for each.",
        url: "https://pgexercises.com/",
        category: "SQL & Databases",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "101",
        name: "Select Star SQL",
        description: "An interactive book that teaches SQL by exploring real data about death row inmates.",
        url: "https://selectstarsql.com/",
        category: "SQL & Databases",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "102",
        name: "HackerRank SQL",
        description: "Graded SQL practice from basic queries to advanced joins and aggregations.",
        url: "https://www.hackerrank.com/domains/sql",
        category: "SQL & Databases",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "103",
        name: "LeetCode Database Problems",
        description: "All of LeetCode's SQL interview questions, filterable by difficulty.",
        url: "https://leetcode.com/problemset/database/",
        category: "SQL & Databases",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "104",
        name: "DataLemur",
        description: "SQL interview questions from real companies, with solutions and a built-in editor.",
        url: "https://datalemur.com/",
        category: "SQL & Databases",
        difficulty: "Intermediate",
        problems: 0
      },
      {
        _id: "105",
        name: "Use The Index, Luke",
        description: "A free guide to how SQL indexes work and how to write fast queries.",
        url: "https://use-the-index-luke.com/",
        category: "SQL & Databases",
        difficulty: "Advanced",
        problems: 0
      },
      {
        _id: "106",
        name: "Modern SQL",
        description: "What newer SQL can do (window functions, CTEs, JSON) with examples and database support tables.",
        url: "https://modern-sql.com/",
        category: "SQL & Databases",
        difficulty: "Advanced",
        problems: 0
      },
      {
        _id: "107",
        name: "CS50's Introduction to Databases with SQL",
        description: "Harvard's course on relational databases and SQL, with lectures and problem sets.",
        url: "https://cs50.harvard.edu/sql/",
        category: "SQL & Databases",
        difficulty: "Beginner",
        problems: 0
      },
      {
        _id: "108",
        name: "Khan Academy: Intro to SQL",
        description: "Short, gentle video lessons and exercises for your first queries.",
        url: "https://www.khanacademy.org/computing/computer-programming/sql",
        category: "SQL & Databases",
        difficulty: "Beginner",
        problems: 0
      }
    ]
  };
};