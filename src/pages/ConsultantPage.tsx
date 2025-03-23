
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatConsultant from "@/components/ChatConsultant";

const ConsultantPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Main content with padding to avoid navbar overlap */}
      <main className="flex-1 flex flex-col pt-16 pb-0">
        <div className="flex-1 flex flex-col h-[calc(100vh-8rem)]">
          <ChatConsultant initialSidebarOpen={sidebarOpen} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ConsultantPage;
