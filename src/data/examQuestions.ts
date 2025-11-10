export interface Question {
  id: string;
  type: 'blank' | 'audio' | 'multiple';
  question: string;
  tts_text?: string;
  answers?: string[];
  options?: string[];
}

export interface Section {
  title: string;
  questions: Record<string, Question>;
}

export const examData = {
  exam: {
    title: "Computer Knowledge Objective Assessment",
    description: "A written and audio-based test with one-word or short factual answers.",
    sets: {
      section1_accomodation: {
        title: "Accomodation Questions",
        questions: {
          Q1: {
            id: "Q1",
            type: "blank" as const,
            question: "What is your age?"
          },
          Q2: {
            id: "Q2",
            type: "multiple" as const,
            question: "Choose what best describes you:",
            options: [
              "student",
              "employee",
              "working student",
              "freelancer",
              "entrepreneur",
              "other"
            ]
          },
          Q3: {
            id: "Q3",
            type: "audio" as const,
            question: "Record yourself answering the next audio question:",
            tts_text: "What day is it today?"
          },
          Q4: {
            id: "Q4",
            type: "multiple" as const,
            question: "Would you say you remember information better when you hear it or when you see it (for example, by reading or looking at images)?",
            options: [
              "I remember better when I read.",
              "I remember better when I hear."
            ]
          },
          Q5: {
            id: "Q5",
            type: "blank" as const,
            question: "Can you remember what the first question was? Write it down."
          }
        }
      },
      section2_standard: {
        title: "Section 2: Written - Standard",
        questions: {
          Q1: { id: "Q1", type: "blank" as const, question: "How many bits are there in one byte?", answers: ["8", "eight"] },
          Q2: { id: "Q2", type: "blank" as const, question: "Which type of memory is volatile and temporarily stores data during execution?", answers: ["RAM", "Random Access Memory"] },
          Q3: { id: "Q3", type: "blank" as const, question: "Which component performs arithmetic and logical operations?", answers: ["ALU", "Arithmetic Logic Unit"] },
          Q4: { id: "Q4", type: "blank" as const, question: "Which device forwards packets based on IP addresses?", answers: ["Router"] },
          Q5: { id: "Q5", type: "blank" as const, question: "Which logic gate outputs true only when all inputs are true?", answers: ["AND", "AND gate"] },
          Q6: { id: "Q6", type: "blank" as const, question: "Which layer of the OSI model handles routing and IP addressing?", answers: ["Network layer"] },
          Q7: { id: "Q7", type: "blank" as const, question: "Which protocol is used for secure file transfer over SSH?", answers: ["SFTP", "Secure File Transfer Protocol"] },
          Q8: { id: "Q8", type: "blank" as const, question: "Which port number is used by HTTP?", answers: ["80"] },
          Q9: { id: "Q9", type: "blank" as const, question: "Which data structure uses hierarchical parent-child relationships?", answers: ["Tree"] },
          Q10: { id: "Q10", type: "blank" as const, question: "Which SQL clause filters query results?", answers: ["WHERE"] },
          Q11: { id: "Q11", type: "blank" as const, question: "Which component controls data flow within the CPU?", answers: ["Control Unit"] },
          Q12: { id: "Q12", type: "blank" as const, question: "What is the Big O time complexity of linear search?", answers: ["O(n)"] }
        }
      },
      section2_control: {
        title: "Section 2: Written - Control",
        questions: {
          Q1: { id: "Q1", type: "blank" as const, question: "Which number system uses base 2?", answers: ["Binary"] },
          Q2: { id: "Q2", type: "blank" as const, question: "Which type of memory retains data even when power is off?", answers: ["ROM", "Read Only Memory"] },
          Q3: { id: "Q3", type: "blank" as const, question: "What does the acronym ISA stand for?", answers: ["Instruction Set Architecture"] },
          Q4: { id: "Q4", type: "blank" as const, question: "Which device connects computers within the same network using MAC addresses?", answers: ["Switch"] },
          Q5: { id: "Q5", type: "blank" as const, question: "Which logic gate outputs the opposite of its input?", answers: ["NOT", "NOT gate"] },
          Q6: { id: "Q6", type: "blank" as const, question: "Which OSI layer ensures reliable data delivery?", answers: ["Transport layer"] },
          Q7: { id: "Q7", type: "blank" as const, question: "Which protocol secures web communication?", answers: ["HTTPS"] },
          Q8: { id: "Q8", type: "blank" as const, question: "Which port number is used by HTTPS?", answers: ["443"] },
          Q9: { id: "Q9", type: "blank" as const, question: "Which data structure uses nodes connected by edges?", answers: ["Graph"] },
          Q10: { id: "Q10", type: "blank" as const, question: "Which command in SQL removes all table data but keeps the structure?", answers: ["TRUNCATE"] },
          Q11: { id: "Q11", type: "blank" as const, question: "Which CPU part temporarily stores instructions and data?", answers: ["Cache"] },
          Q12: { id: "Q12", type: "blank" as const, question: "What is the Big O time complexity of binary search?", answers: ["O(log n)", "O(logn)"] }
        }
      },
      section3_standard: {
        title: "Section 3: Audio - Standard",
        questions: {
          Q1: { id: "Q1", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "What does the acronym D R A M stand for?", answers: ["Dynamic Random Access Memory"] },
          Q2: { id: "Q2", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "What does the acronym M A C stand for?", answers: ["Media Access Control"] },
          Q3: { id: "Q3", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which software manages computer hardware?", answers: ["Operating system", "OS"] },
          Q4: { id: "Q4", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "What does the acronym W A N stand for?", answers: ["Wide Area Network"] },
          Q5: { id: "Q5", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which programming language keyword is used to create an object in C++?", answers: ["new"] },
          Q6: { id: "Q6", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which OOP concept allows the same method name with different parameters?", answers: ["Overloading", "Function overloading"] },
          Q7: { id: "Q7", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which OOP concept hides implementation details from users?", answers: ["Encapsulation"] },
          Q8: { id: "Q8", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which Linux command changes the current directory?", answers: ["cd"] },
          Q9: { id: "Q9", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which data structure operates on a First In First Out basis?", answers: ["Queue"] },
          Q10: { id: "Q10", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which scheduling algorithm executes the shortest job next?", answers: ["Shortest Job First", "SJF"] },
          Q11 : { id: "Q11", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which sorting algorithm builds the final sorted array one item at a time?", answers: ["Insertion Sort"] },
          Q12: { id: "Q12", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which algorithm finds the shortest path in a weighted graph?", answers: ["Dijkstra's algorithm", "Dijkstra algorithm"] }
        }
      },
      section3_control: {
        title: "Section 3: Audio - Control",
        questions: {
          Q1: { id: "Q1", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "What does the acronym S R A M stand for?", answers: ["Static Random Access Memory"] },
          Q2: { id: "Q2", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "What does the acronym V P N stand for?", answers: ["Virtual Private Network"] },
          Q3: { id: "Q3", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which type of software translates high-level code to machine code?", answers: ["Compiler"] },
          Q4: { id: "Q4", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "What does the acronym L A N stand for?", answers: ["Local Area Network"] },
          Q5: { id: "Q5", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which keyword is used to destroy an object in C++?", answers: ["delete"] },
          Q6: { id: "Q6", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which OOP concept allows subclasses to reuse parent methods?", answers: ["Inheritance"] },
          Q7: { id: "Q7", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which OOP concept allows one interface to be used for different data types?", answers: ["Polymorphism"] },
          Q8: { id: "Q8", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which command in Linux lists files and directories?", answers: ["ls"] },
          Q9: { id: "Q9", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which data structure operates on a Last In First Out basis?", answers: ["Stack"] },
          Q10: { id: "Q10", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which scheduling algorithm gives equal CPU time to all processes?", answers: ["Round Robin"] },
          Q11: { id: "Q11", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which algorithm uses divide and conquer for sorting?", answers: ["Merge Sort"] },
          Q12: { id: "Q12", type: "audio" as const, question: "Record yourself answering the next audio question:", tts_text: "Which algorithm uses a greedy approach to find the minimum spanning tree?", answers: ["Prim's algorithm", "Prim algorithm"] }
        }
      }
    }
  }
};
