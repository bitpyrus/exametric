export interface Question {
  id: string;
  type: 'blank' | 'audio';
  question: string;
  tts_text?: string;
  answers: string[];
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
      section1_standard: {
        title: "Section 1: Written - Standard",
        questions: {
          Q1: { id: "Q1", type: "blank" as const, question: "How many bits are there in one byte?", answers: ["8", "eight"] },
          Q2: { id: "Q2", type: "blank" as const, question: "Which type of memory is volatile and temporarily stores data during execution?", answers: ["RAM", "Random Access Memory"] },
          Q3: { id: "Q3", type: "blank" as const, question: "Which type of memory retains data even when power is off?", answers: ["ROM", "Read Only Memory"] },
          Q4: { id: "Q4", type: "blank" as const, question: "Which component performs arithmetic and logical operations?", answers: ["ALU", "Arithmetic Logic Unit"] },
          Q5: { id: "Q5", type: "blank" as const, question: "Which device forwards packets based on IP addresses?", answers: ["Router"] },
          Q6: { id: "Q6", type: "blank" as const, question: "Which device connects computers within the same network using MAC addresses?", answers: ["Switch"] },
          Q7: { id: "Q7", type: "blank" as const, question: "Which logic gate outputs true only when all inputs are true?", answers: ["AND", "AND gate"] },
          Q8: { id: "Q8", type: "blank" as const, question: "Which layer of the OSI model handles routing and IP addressing?", answers: ["Network layer"] },
          Q9: { id: "Q9", type: "blank" as const, question: "Which protocol is used for secure file transfer over SSH?", answers: ["SFTP", "Secure File Transfer Protocol"] },
          Q10: { id: "Q10", type: "blank" as const, question: "Which port number is used by HTTPS?", answers: ["443"] },
          Q11: { id: "Q11", type: "blank" as const, question: "Which data structure uses hierarchical parent-child relationships?", answers: ["Tree"] }
        }
      },
      section1_control: {
        title: "Section 1: Written - Control",
        questions: {
          Q1: { id: "Q1", type: "blank" as const, question: "Which component controls data flow within the CPU?", answers: ["Control Unit"] },
          Q2: { id: "Q2", type: "blank" as const, question: "Which OSI layer ensures reliable data delivery?", answers: ["Transport layer"] },
          Q3: { id: "Q3", type: "blank" as const, question: "Which logic gate outputs the opposite of its input?", answers: ["NOT", "NOT gate"] },
          Q4: { id: "Q4", type: "blank" as const, question: "Which data structure operates on a First In First Out basis?", answers: ["Queue"] },
          Q5: { id: "Q5", type: "blank" as const, question: "Which data structure operates on a Last In First Out basis?", answers: ["Stack"] },
          Q6: { id: "Q6", type: "blank" as const, question: "What is the Big O time complexity of binary search?", answers: ["O(log n)", "O(logn)"] },
          Q7: { id: "Q7", type: "blank" as const, question: "Which algorithm finds the shortest path in a weighted graph?", answers: ["Dijkstra's algorithm", "Dijkstra algorithm"] },
          Q8: { id: "Q8", type: "blank" as const, question: "Which algorithm uses divide and conquer for sorting?", answers: ["Merge Sort"] },
          Q9: { id: "Q9", type: "blank" as const, question: "Which SQL clause filters query results?", answers: ["WHERE"] },
          Q10: { id: "Q10", type: "blank" as const, question: "Which command in Linux lists files and directories?", answers: ["ls"] },
          Q11: { id: "Q11", type: "blank" as const, question: "Which scheduling algorithm executes the shortest job next?", answers: ["Shortest Job First", "SJF"] }
        }
      },
      section2_standard: {
        title: "Section 2: Audio - Standard",
        questions: {
          Q1: { id: "Q1", type: "audio" as const, question: "Expand DRAM.", tts_text: "Expand DRAM.", answers: ["Dynamic Random Access Memory"] },
          Q2: { id: "Q2", type: "audio" as const, question: "Expand MAC.", tts_text: "Expand MAC.", answers: ["Media Access Control"] },
          Q3: { id: "Q3", type: "audio" as const, question: "Which software manages computer hardware?", tts_text: "Which software manages computer hardware?", answers: ["Operating system", "OS"] },
          Q4: { id: "Q4", type: "audio" as const, question: "Expand WAN.", tts_text: "Expand WAN.", answers: ["Wide Area Network"] },
          Q5: { id: "Q5", type: "audio" as const, question: "Which protocol transfers web data?", tts_text: "Which protocol transfers web data?", answers: ["HTTP"] },
          Q6: { id: "Q6", type: "audio" as const, question: "Which programming language keyword is used to create an object in C++?", tts_text: "Which programming language keyword is used to create an object in C++?", answers: ["new"] },
          Q7: { id: "Q7", type: "audio" as const, question: "Which OOP concept allows the same method name with different parameters?", tts_text: "Which OOP concept allows the same method name with different parameters?", answers: ["Overloading", "Function overloading"] },
          Q8: { id: "Q8", type: "audio" as const, question: "Which OOP concept hides implementation details from users?", tts_text: "Which OOP concept hides implementation details from users?", answers: ["Encapsulation"] },
          Q9: { id: "Q9", type: "audio" as const, question: "Which Linux command changes the current directory?", tts_text: "Which Linux command changes the current directory?", answers: ["cd"] },
          Q10: { id: "Q10", type: "audio" as const, question: "Which data structure is best for depth-first search?", tts_text: "Which data structure is best for depth-first search?", answers: ["Stack"] },
          Q11: { id: "Q11", type: "audio" as const, question: "Which number system uses base 2?", tts_text: "Which number system uses base 2?", answers: ["Binary"] }
        }
      },
      section2_control: {
        title: "Section 2: Audio - Control",
        questions: {
          Q1: { id: "Q1", type: "audio" as const, question: "Expand SRAM.", tts_text: "Expand SRAM.", answers: ["Static Random Access Memory"] },
          Q2: { id: "Q2", type: "audio" as const, question: "Expand ISA.", tts_text: "Expand ISA.", answers: ["Instruction Set Architecture"] },
          Q3: { id: "Q3", type: "audio" as const, question: "Which protocol secures web communication?", tts_text: "Which protocol secures web communication?", answers: ["HTTPS"] },
          Q4: { id: "Q4", type: "audio" as const, question: "Which port number is used by HTTP?", tts_text: "Which port number is used by HTTP?", answers: ["80"] },
          Q5: { id: "Q5", type: "audio" as const, question: "Which CPU part temporarily stores instructions and data?", tts_text: "Which CPU part temporarily stores instructions and data?", answers: ["Cache"] },
          Q6: { id: "Q6", type: "audio" as const, question: "Which OOP concept allows subclasses to reuse parent methods?", tts_text: "Which OOP concept allows subclasses to reuse parent methods?", answers: ["Inheritance"] },
          Q7: { id: "Q7", type: "audio" as const, question: "Which command in SQL removes all table data but keeps the structure?", tts_text: "Which command in SQL removes all table data but keeps the structure?", answers: ["TRUNCATE"] },
          Q8: { id: "Q8", type: "audio" as const, question: "Which data structure uses nodes connected by edges?", tts_text: "Which data structure uses nodes connected by edges?", answers: ["Graph"] },
          Q9: { id: "Q9", type: "audio" as const, question: "Which type of database uses tables, rows, and columns?", tts_text: "Which type of database uses tables, rows, and columns?", answers: ["Relational database"] },
          Q10: { id: "Q10", type: "audio" as const, question: "Which scheduling algorithm gives equal CPU time to all processes?", tts_text: "Which scheduling algorithm gives equal CPU time to all processes?", answers: ["Round Robin"] },
          Q11: { id: "Q11", type: "audio" as const, question: "Which programming concept uses a hierarchical parent-child structure?", tts_text: "Which programming concept uses a hierarchical parent-child structure?", answers: ["Tree"] }
        }
      }
    }
  }
};
