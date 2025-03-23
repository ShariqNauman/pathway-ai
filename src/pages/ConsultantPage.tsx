
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatConsultant from "@/components/ChatConsultant";

const ConsultantPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Add top padding to push content below the header */}
      <main className="flex-1 pt-20">
        <div className="h-[calc(100vh-8rem-5rem)] overflow-hidden">
          <ChatConsultant initialSidebarOpen={sidebarOpen} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ConsultantPage;
