// FaqPage.jsx with enhanced animations
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import Logo from '../../assets/Logo1.png';
const FaqPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordions, setOpenAccordions] = useState({});
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  
  // FAQ categories with their respective questions and answers
  const faqData = [
    {
      category: "Getting Started",
      faqs: [
        {
          id: "q1",
          question: "What is Klarifai?",
          answer: "Klarifai is a Retrieval-Augmented Generation (RAG) chatbot that allows users to upload documents, ask questions based on the document content, and generate document summaries.",
          image: "/faq-images/klarifai-overview.png"
        },
        {
          id: "q2",
          question: "How do I upload a document to Klarifai?",
          answer: "Click on the Upload button in the Document Section, select a file from your device, and wait for it to be processed. Once uploaded, it will be visible in the sidebar.",
          image: "/faq-images/document-upload.png"
        },
        {
          id: "q3",
          question: "What document formats does Klarifai support?",
          answer: "Klarifai supports multiple formats, including PDF, DOCX, TXT, and CSV. You can view uploaded documents directly within the app.",
          image: "/faq-images/supported-formats.png"
        }
      ]
    },
    {
      category: "Chatting with Documents",
      faqs: [
        {
          id: "q4",
          question: "How can I ask a question about my uploaded document?",
          answer: "Once a document is uploaded, type your question in the chat input box and press Enter. Klarifai will generate a response based on the document's content.",
          image: "/faq-images/asking-questions.png"
        },
        {
          id: "q5",
          question: "What happens if I select multiple documents?",
          answer: "If multiple documents are selected, Klarifai will process them together and generate a consolidated response based on the selected files.",
          image: "/faq-images/multiple-documents.png"
        },
        {
          id: "q6",
          question: "Can I copy the response provided by Klarifai?",
          answer: "Yes! Each response has a copy option below it. Click on it to copy the answer to your clipboard.",
          image: "/faq-images/copy-response.png"
        }
      ]
    },
    {
      category: "Web-Enhanced Mode",
      faqs: [
        {
          id: "q7",
          question: "What is the Web-Enhanced Mode?",
          answer: "The Web-Enhanced Mode allows you to ask questions beyond the selected document by integrating external information from the web.",
          image: "/faq-images/web-enhanced.png"
        },
        {
          id: "q8",
          question: "How do I enable Web-Enhanced Mode?",
          answer: "Toggle the Web-Enhanced Mode switch before asking a question. If enabled, responses may include additional insights from online sources.",
          image: "/faq-images/enable-web-mode.png"
        }
      ]
    },
    {
      category: "Summarization Feature",
      faqs: [
        {
          id: "q9",
          question: "How do I summarize a document?",
          answer: "Select an uploaded document and click on the Summarize button. Klarifai will generate a brief summary of the document.",
          image: "/faq-images/summarize-document.png"
        },
        {
          id: "q10",
          question: "Can I summarize multiple documents at once?",
          answer: "Yes! If you select multiple documents, Klarifai will generate a consolidated summary combining key points from all selected documents.",
          image: "/faq-images/multiple-summaries.png"
        },
        {
          id: "q11",
          question: "Can I copy the generated summary?",
          answer: "Yes, there is a copy button next to the summary. Click it to copy the summarized text.",
          image: "/faq-images/copy-summary.png"
        }
      ]
    },
    {
      category: "Managing Documents & Chats",
      faqs: [
        {
          id: "q12",
          question: "Where can I see my uploaded documents?",
          answer: "All uploaded documents appear in the Documents Section of the sidebar. You can browse, search, or filter documents easily.",
          image: "/faq-images/document-section.png"
        },
        {
          id: "q13",
          question: "Can I search for a document by name?",
          answer: "Yes! Use the search bar in the Documents Section to find a document by its name.",
          image: "/faq-images/search-documents.png"
        },
        {
          id: "q14",
          question: "How can I delete a document?",
          answer: "Click on the delete option next to the document in the Documents Section. Confirm your action to remove it permanently.",
          image: "/faq-images/delete-document.png"
        },
        {
          id: "q15",
          question: "Where can I find my previous chats?",
          answer: "Your past conversations are stored in the Recent Chat Section of the sidebar.",
          image: "/faq-images/recent-chats.png"
        },
        {
          id: "q16",
          question: "Can I rename a chat session?",
          answer: "Yes! Click on a chat name in the Recent Chat Section, select Edit, and type the new name.",
          image: "/faq-images/rename-chat.png"
        },
        {
          id: "q17",
          question: "How do I delete a chat session?",
          answer: "Click on the delete button next to a chat session to remove it.",
          image: "/faq-images/delete-chat.png"
        },
        {
          id: "q18",
          question: "Can I filter my documents based on chat dates?",
          answer: "Yes! Use the date filter in the Documents Section to find documents linked to chats from specific dates.",
          image: "/faq-images/date-filter.png"
        }
      ]
    },
    {
      category: "Voice Input & Follow-Up Questions",
      faqs: [
        {
          id: "q19",
          question: "Can I use voice input instead of typing?",
          answer: "Yes! Click the mic button in the text input area, speak your question, and Klarifai will convert your voice into text.",
          image: "/faq-images/voice-input.png"
        },
        {
          id: "q20",
          question: "What are follow-up questions, and how do I see them?",
          answer: "After each response, Klarifai suggests three follow-up questions related to your previous query. You can see them by clicking the collapsing/open section above the input box.",
          image: "/faq-images/followup-questions.png"
        }
      ]
    },
    {
      category: "Navigation & Settings",
      faqs: [
        {
          id: "q21",
          question: "How do I switch between modules in Klarifai?",
          answer: "In the header section, use the Module Switcher to switch between Document QnA and Idea Generator modules.",
          image: "/faq-images/module-switch.png"
        },
        {
          id: "q22",
          question: "What does the Home button do?",
          answer: "Clicking the Home key redirects you to the My Projects section.",
          image: "/faq-images/home-button.png"
        },
        {
          id: "q23",
          question: "How can I change my profile picture?",
          answer: "Click on your profile button in the top-right corner, select Change Profile Picture, and upload a new image.",
          image: "/faq-images/profile-picture.png"
        },
        {
          id: "q24",
          question: "How do I log out of Klarifai?",
          answer: "Click on the profile button, then select Logout to sign out of your account.",
          image: "/faq-images/logout.png"
        }
      ]
    }
  ];

  // Initialize all FAQs
  useEffect(() => {
    setFilteredFaqs(faqData);
    
    // Add fade-in animation to the page on load
    document.body.classList.add('animate-fade-in');
    
    return () => {
      document.body.classList.remove('animate-fade-in');
    };
  }, []);

  // Handle search filtering
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFaqs(faqData);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = faqData.map(category => {
        const filteredFaqs = category.faqs.filter(
          faq => 
            faq.question.toLowerCase().includes(term) || 
            faq.answer.toLowerCase().includes(term)
        );
        
        if (filteredFaqs.length > 0) {
          return { ...category, faqs: filteredFaqs };
        }
        return null;
      }).filter(Boolean);
      
      setFilteredFaqs(filtered);
    }
  }, [searchTerm]);

  const toggleAccordion = (id) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white py-12 shadow-md animate-slide-down">
        <div className="container mx-auto px-6 md:px-12">
          {/* Logo and title container */}
          <div className="flex items-center justify-center md:justify-start mb-7 animate-fade-in">
            <img 
              src={Logo}
              alt="Klarifai Logo" 
              className="h-9 mr-4 transition-all duration-300 hover:scale-105" 
            />
          </div>
          
          {/* Search Bar with spacing below logo */}
          <div className="relative max-w-2xl mx-auto md:mx-0 mt-4 animate-slide-up">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-300" />
            </div>
            <input
              type="text"
              placeholder="Search for questions or topics..."
              className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-600 text-gray-200 placeholder-gray-200 focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* FAQ Content */}
      <main className="container mx-auto px-4 py-8 md:px-12 animate-fade-in-delayed">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <h2 className="text-2xl font-semibold text-gray-700">No results found</h2>
            <p className="mt-2 text-gray-500">Try different keywords or browse through the categories below.</p>
          </div>
        ) : (
          filteredFaqs.map((category, index) => (
            <div key={index} className="mb-10 animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
              <h2 className="text-2xl font-bold text-blue-900 mb-4">{category.category}</h2>
              <div className="space-y-4">
                {category.faqs.map((faq, faqIndex) => (
                  <div 
                    key={faq.id} 
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md"
                    style={{ animationDelay: `${(index * 100) + (faqIndex * 50)}ms` }}
                  >
                    <button
                      className="w-full flex justify-between items-center p-5 text-left bg-gray-50 transition-all duration-300 hover:bg-gray-100 focus:outline-none group"
                      onClick={() => toggleAccordion(faq.id)}
                      aria-expanded={openAccordions[faq.id]}
                    >
                      <h3 className="text-lg font-medium text-gray-900 transition-all duration-300 group-hover:text-blue-700 group-hover:translate-x-1">{faq.question}</h3>
                      {openAccordions[faq.id] ? (
                        <ChevronUp className="h-5 w-5 text-blue-600 transition-transform duration-300 transform" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-blue-600 transition-transform duration-300 transform group-hover:translate-y-1" />
                      )}
                    </button>
                    
                    {openAccordions[faq.id] && (
                      <div className="p-5 bg-white border-t border-gray-200 animate-fade-in">
                        <p className="text-gray-700 mb-4">{faq.answer}</p>
                        {faq.image && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 animate-scale-in">
                            <img 
                              src={faq.image} 
                              alt={`Illustration for ${faq.question}`} 
                              className="w-full max-w-2xl object-contain transition-transform duration-500 hover:scale-[1.02]"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Klarifai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default FaqPage;