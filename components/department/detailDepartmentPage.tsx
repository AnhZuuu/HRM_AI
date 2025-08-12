"use client";
import * as React from "react";
import { FaBuilding, FaUsers, FaBriefcase, FaInfoCircle } from "react-icons/fa";

type TabKey = "employees" | "positions";

export default function DepartmentDetailClient(
  { dept }:  { dept: Department & { numOfEmployee?: number; numOfCampaignPosition?: number }; }) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("employees");

  const empCount = dept.employees?.length ?? 0;
  const posCount = dept.campaignPositions?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-lg p-6 relative">
        <div className="absolute -top-[30px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[60px] border-r-[60px] border-b-[35px] border-l-transparent border-r-transparent border-b-blue-500"></div>

        <div className="flex items-center mb-6 gap-3">
          <FaBuilding className="text-blue-600 text-3xl" />
          <h1 className="text-3xl font-bold text-gray-800">{dept.departmentName}</h1>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              {dept.code}
            </span>
          </div>

          {dept.description && (
            <div className="flex items-start gap-2">
              <FaInfoCircle className="text-gray-500 mt-1" />
              <p className="text-gray-700">{dept.description}</p>
            </div>
          )}


          <div className="flex items-center gap-4">
            <div className="flex items-center text-gray-700 gap-2">
              {/* same icon classes you used */}
              <FaUsers />
              <span>{dept.numOfEmployee} nhân sự</span>
            </div>
            <div className="flex items-center text-gray-700 gap-2">
              <FaUsers />
              <span>{dept.numOfCampaignPosition} vị trí tuyển</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            className={`px-4 py-2 rounded ${activeTab === "employees" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTab("employees")}
          >
            Nhân viên
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === "positions" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTab("positions")}
          >
            Vị trí tuyển
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "employees" && (
            <div className="space-y-4">
              {empCount === 0 ? (
                <p className="text-gray-500">Không có nhân sự trong phòng ban này.</p>
              ) : (
                dept.employees!.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 border border-gray-200 rounded p-3 bg-gray-50">
                    <div>
                      <p className="text-gray-800 font-medium">
                        {user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : (user.username ?? user.email ?? user.id)}
                      </p>
                      {user.phoneNumber && <p className="text-gray-500">{user.phoneNumber}</p>}
                      <p className="text-gray-500">{user.email || "Chưa có email"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "positions" && (
            <div className="space-y-4">
              {posCount === 0 ? (
                <p className="text-gray-500">Chưa có vị trí tuyển nào.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dept.campaignPositions!.map((pos) => (
                    <div key={pos.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                      <p className="text-gray-800 font-semibold">{pos.description ?? `Vị trí ${pos.id}`}</p>
                      {pos.description && (
                        <p className="text-gray-600 mt-1 text-sm">{pos.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
