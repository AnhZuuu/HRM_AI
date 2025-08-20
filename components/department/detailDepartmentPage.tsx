"use client";
import * as React from "react";
import { FaBuilding, FaUsers, FaBriefcase, FaInfoCircle } from "react-icons/fa";

type TabKey = "employees" | "positions";

type Employee = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
};

// type CampaignPositionDetail = {
//   id: string;
//   campaignPositionId?: string;
//   type?: string | null;
//   key?: string | null;
//   value?: string | null;
//   groupIndex?: number | null;
// };

// type CampaignPositionModel = {
//   id: string;
//   departmentId?: string | null;
//   campaignId?: string | null;
//   departmentName?: string | null;
//   totalSlot?: number | null;
//   description?: string | null;

//   // Support both shapes (your API shows ...DetailModels)
//   campaignPositionDetailModels?: CampaignPositionDetail[] | null;
//   campaignPositionDetail?: CampaignPositionDetail[] | null;
// };

type DeptFromServer = {
  id: string;
  departmentName: string;
  code: string;
  description?: string | null;

  numOfEmployee?: number | null;
  numOfCampaignPosition?: number | null;

  employees?: Employee[] | null;
  campaignPositionModels?: CampaignPositionModel[] | null;
};

export default function DepartmentDetailClient({ dept }: { dept: DeptFromServer }) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("employees");

  const employees = Array.isArray(dept.employees) ? dept.employees : [];
  const positions = Array.isArray(dept.campaignPositionModels) ? dept.campaignPositionModels : [];

  const empCount = employees.length;
  const posCount = positions.length;

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
              <FaUsers />
              <span>{Number(dept.numOfEmployee ?? empCount)} nhân sự</span>
            </div>
            <div className="flex items-center text-gray-700 gap-2">
              <FaBriefcase />
              <span>{Number(dept.numOfCampaignPosition ?? posCount)} vị trí tuyển</span>
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
              {employees.length === 0 ? (
                <p className="text-gray-500">Không có nhân sự trong phòng ban này.</p>
              ) : (
                employees.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 border border-gray-200 rounded p-3 bg-gray-50"
                  >
                    <div>
                      <p className="text-gray-800 font-medium">
                        {user.firstName || user.lastName
                          ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                          : user.username ?? user.email ?? user.id}
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
              {positions.length === 0 ? (
                <p className="text-gray-500">Chưa có vị trí tuyển nào.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {positions.map((pos) => {
                    // read either ...DetailModels or ...Detail
                    const rawDetails =
                      (pos as any).campaignPositionDetailModels ??
                      pos.campaignPositionDetail ??
                      [];
                    const details: CampaignPositionDetail[] = Array.isArray(rawDetails)
                      ? rawDetails.filter(Boolean)
                      : [];

                    return (
                      <div
                        key={pos.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-gray-800 font-semibold">
                            {pos.description ?? `Vị trí ${pos.id}`}
                          </p>
                          {typeof pos.totalSlot === "number" && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                              {pos.totalSlot} slot
                            </span>
                          )}
                        </div>

                        {/* Grouped details by type, sorted by groupIndex then key */}
                        {details.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {Object.entries(
                              details.reduce<Record<string, CampaignPositionDetail[]>>((acc, d) => {
                                const t = (d.type ?? "Khác").trim() || "Khác";
                                (acc[t] ||= []).push(d);
                                return acc;
                              }, {})
                            ).map(([type, items]) => (
                              <div
                                key={type}
                                className="rounded-lg border border-gray-200 bg-white p-3"
                              >
                                <div className="mb-2 flex items-center gap-2">
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-100">
                                    {type}
                                  </span>
                                  <span className="text-xs text-gray-500">{items.length} yêu cầu</span>
                                </div>

                                <ul className="space-y-2">
                                  {items
                                    .slice()
                                    .sort(
                                      (a, b) =>
                                        (a.groupIndex ?? 0) - (b.groupIndex ?? 0) ||
                                        (a.key ?? "").localeCompare(b.key ?? "")
                                    )
                                    .map((d) => (
                                      <li key={d.id} className="flex items-start gap-3">
                                        <span className="text-[10px] leading-5 h-5 w-5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 flex items-center justify-center">
                                          {d.groupIndex ?? 0}
                                        </span>
                                        <div className="flex-1">
                                          <div className="text-sm text-gray-800">{d.key ?? "Không rõ"}</div>
                                          {d.value && (
                                            <div className="text-xs text-gray-500">{d.value}</div>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
