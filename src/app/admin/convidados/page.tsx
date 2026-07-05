"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import GuestListTab from "@/components/admin/GuestListTab";
import RsvpListTab from "@/components/admin/RsvpListTab";
import { Users, CheckCircle } from "lucide-react";

export default function AdminGuestsPage() {
  const [activeTab, setActiveTab] = useState<"guests" | "rsvps">("guests");

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-1 p-6 md:pl-72 md:pr-8 md:py-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          
          {/* Tabs Navigation */}
          <div className="mb-8 border-b border-slate-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("guests")}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm outline-none transition-all
                  ${activeTab === "guests"
                    ? "border-[#5c5bd5] text-[#5c5bd5]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }
                `}
              >
                <Users className="h-4.5 w-4.5" />
                Lista Mestra
              </button>
              
              <button
                onClick={() => setActiveTab("rsvps")}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm outline-none transition-all
                  ${activeTab === "rsvps"
                    ? "border-sky-500 text-sky-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }
                `}
              >
                <CheckCircle className="h-4.5 w-4.5" />
                RSVPs Confirmados
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "guests" && <GuestListTab />}
            {activeTab === "rsvps" && <RsvpListTab />}
          </div>

        </div>
      </div>
    </div>
  );
}
