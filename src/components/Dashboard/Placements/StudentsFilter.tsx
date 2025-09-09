"use client";

import React from "react";
import { useData } from "@/contexts/DataContext";
import { Download, Filter as FilterIcon, Search, X, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

type SortKey = "name" | "department" | "year" | "skillsCount";

export default function StudentsFilter() {
  const { users } = useData();
  const searchParams = useSearchParams();
  const exportTriggered = React.useRef(false);

  // Source dataset: students only
  const students = React.useMemo(() => users.filter(u => u.role === "student"), [users]);

  // Derived filter options
  const departments = React.useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const years = React.useMemo(() => {
    const set = new Set<number>();
    students.forEach(s => {
      if (typeof s.year === "number") set.add(s.year);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [students]);

  const skillsOptions = React.useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => s.skills?.forEach(sk => set.add(sk)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const genderOptions = React.useMemo(() => getGenderOptions(students), [students]);

  // UI state
  const [department, setDepartment] = React.useState<string>("all");
  const [year, setYear] = React.useState<string>("all");
  const [skills, setSkills] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState<string>("");
  const [gender, setGender] = React.useState<string>("all");

  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const [page, setPage] = React.useState<number>(1);
  const pageSize = 10;

  // Filtering
  const filtered = React.useMemo(() => {
    let list = [...students];

    if (department !== "all") {
      list = list.filter(s => (s.department || "") === department);
    }

    if (year !== "all") {
      const y = parseInt(year, 10);
      if (!Number.isNaN(y)) list = list.filter(s => s.year === y);
    }

    if (skills.length > 0) {
      list = list.filter(s => {
        const userSkills = new Set((s.skills || []).map(sk => sk.toLowerCase()));
        return skills.every(sel => userSkills.has(sel.toLowerCase()));
      });
    }

    // Gender filter (demo): Only applies if dataset contains gender values
    if (gender !== "all") {
      list = list.filter((s) => {
        const g = (s as any).gender as string | undefined;
        return (g || "").toLowerCase() === gender.toLowerCase();
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.department || "").toLowerCase().includes(q) ||
        (s.skills || []).some(sk => sk.toLowerCase().includes(q))
      );
    }

    return list;
  }, [students, department, year, skills, search, gender]);

  // Sorting
  const sorted = React.useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "department":
          return (a.department || "").localeCompare(b.department || "") * dir;
        case "year":
          return ((a.year || 0) - (b.year || 0)) * dir;
        case "skillsCount":
          return (((a.skills?.length || 0) - (b.skills?.length || 0)) * dir);
        default:
          return 0;
      }
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage]);

  React.useEffect(() => {
    // Reset to page 1 on filter changes
    setPage(1);
  }, [department, year, skills, search, gender]);

  // Auto-export when query param ?export=1 is present
  React.useEffect(() => {
    const exp = searchParams?.get("export");
    if (exp === "1" && !exportTriggered.current) {
      exportTriggered.current = true;
      // Delay to ensure UI is mounted
      setTimeout(() => exportCSV(), 0);
    }
  }, [searchParams]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const clearFilters = () => {
    setDepartment("all");
    setYear("all");
    setSkills([]);
    setSearch("");
    setGender("all");
  };

  const onChangeMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map(o => o.value);
    setSkills(values);
  };

  const exportCSV = () => {
    try {
      if (filtered.length === 0) {
        toast.error("No data to export.");
        return;
      }
      const cols = ["ID", "Name", "Email", "Department", "Year", "Gender", "Skills"];
      const rows = filtered.map(s => [
        s.id,
        escapeCSV(s.name),
        s.email,
        s.department || "",
        s.year?.toString() || "",
        capitalizeWord(((s as any).gender as string | undefined) || ""),
        (s.skills || []).join("; "),
      ]);
      const csv = [cols.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ts = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const fname = `students_export_${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Exported filtered students as CSV");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export CSV");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        className="bg-white border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FilterIcon className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Department */}
          <div>
            <label className="text-xs text-gray-600">Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 text-sm">
              <option value="all">All</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="text-xs text-gray-600">Batch / Year</label>
            <select value={year} onChange={e => setYear(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 text-sm">
              <option value="all">All</option>
              {years.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>

          {/* Gender (demo) */}
          <div>
            <label className="text-xs text-gray-600">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 text-sm"
              disabled={genderOptions.length === 0}
            >
              <option value="all">All</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {genderOptions.length === 0 && (
              <p className="mt-1 text-[11px] text-gray-400">No gender data in demo users</p>
            )}
          </div>

          {/* Skills */}
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Skills (multi-select)</label>
            <select multiple value={skills} onChange={onChangeMultiSelect}
              className="mt-1 w-full rounded-md border-gray-300 text-sm h-[90px]">
              {skillsOptions.map(sk => (
                <option key={sk} value={sk}>{sk}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search and actions */}
        <div className="mt-3 flex flex-col md:flex-row items-stretch md:items-center gap-2">
          <div className="flex-1 flex items-center gap-2 border rounded-md px-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, department, skills"
              className="w-full py-2 text-sm outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Clear search">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearFilters} className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50">Clear</button>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        className="bg-white border rounded-xl">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{paged.length}</span> of <span className="font-medium">{total}</span> students
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <Th label="Name" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                <Th label="Email" sortable={false} />
                <Th label="Department" active={sortKey === "department"} dir={sortDir} onClick={() => toggleSort("department")} />
                <Th label="Year" active={sortKey === "year"} dir={sortDir} onClick={() => toggleSort("year")} />
                <Th label="Skills" active={sortKey === "skillsCount"} dir={sortDir} onClick={() => toggleSort("skillsCount")} />
              </tr>
            </thead>
            <tbody>
              {paged.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">{s.email}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{s.department || "—"}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{s.year ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1 max-w-[420px]">
                      {(s.skills || []).map((sk, idx) => (
                        <span key={`${s.id}-${sk}-${idx}`} className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {sk}
                        </span>
                      ))}
                      {(s.skills?.length || 0) === 0 && <span className="text-gray-400">No skills</span>}
                    </div>
                  </td>
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">No students found for selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
          <div>Page {currentPage} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function escapeCSV(val: string) {
  // Wrap in quotes if needed and escape quotes
  if (/[",\n]/.test(val)) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

function Th({ label, active, dir, onClick, sortable = true }: { label: string; active?: boolean; dir?: "asc" | "desc"; onClick?: () => void; sortable?: boolean; }) {
  return (
    <th className="px-4 py-2 text-left font-medium select-none">
      {sortable ? (
        <button onClick={onClick} className={`inline-flex items-center gap-1 ${active ? "text-blue-700" : "text-gray-700"}`}>
          {label}
          <ArrowUpDown className={`w-3.5 h-3.5 ${active ? "opacity-100" : "opacity-50"}`} />
          {active && <span className="sr-only">sorted {dir}</span>}
        </button>
      ) : (
        <span className="text-gray-700">{label}</span>
      )}
    </th>
  );
}

// Helpers for gender options and formatting
function capitalizeWord(word: string) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function getGenderOptions(list: Array<any>) {
  const set = new Set<string>();
  list.forEach((s) => {
    const g = (s as any).gender as string | undefined;
    if (typeof g === "string" && g.trim()) {
      set.add(capitalizeWord(g.trim()));
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
