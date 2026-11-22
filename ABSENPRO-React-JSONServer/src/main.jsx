import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, CalendarCheck, ClipboardList, ChartNoAxesCombined,
  Settings, Search, Bell, ChevronDown, Plus, Download, Clock3, UserCheck,
  UserX, Timer, CalendarDays, ArrowUpRight, MoreHorizontal, Pencil, Trash2,
  X, Check, Menu, Sparkles, LogOut, Filter, RefreshCw, CheckCircle2,
  CircleAlert, BriefcaseBusiness, Activity, FileSpreadsheet, Camera, RotateCcw
} from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Tooltip, Legend, Filler
} from "chart.js";
import "./style.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const API = "http://localhost:3001";
const today = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);
const initials = (name="") => name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
const formatAttendanceTimestamp = (value) => value
  ? new Date(value).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"medium"})
  : "-";
function AttendancePhotos({record}) {
  const [previewSrc, setPreviewSrc] = useState(null);
  return <div className="attendance-photo-cell">
    {record.checkInPhoto && <button type="button" className="attendance-photo-trigger" onClick={()=>setPreviewSrc(record.checkInPhoto)} title="Lihat foto check-in"><img src={record.checkInPhoto} alt="Foto check-in"/><span>Masuk</span></button>}
    {record.checkOutPhoto && <button type="button" className="attendance-photo-trigger" onClick={()=>setPreviewSrc(record.checkOutPhoto)} title="Lihat foto check-out"><img src={record.checkOutPhoto} alt="Foto check-out"/><span>Pulang</span></button>}
    {!record.checkInPhoto&&!record.checkOutPhoto&&<small>-</small>}
    {previewSrc && <div className="attendance-lightbox" role="dialog" aria-modal="true" aria-label="Pratinjau foto absensi" onClick={()=>setPreviewSrc(null)}>
      <button type="button" className="attendance-lightbox-close" onClick={()=>setPreviewSrc(null)} aria-label="Tutup pratinjau"><X size={22}/></button>
      <img src={previewSrc} alt="Pratinjau foto absensi" onClick={e=>e.stopPropagation()}/>
    </div>}
  </div>;
}
function AttendanceTimes({record}) {
  return <div className="attendance-time-details">
    <span>Masuk: {formatAttendanceTimestamp(record.checkInTimestamp)}</span>
    <span>Pulang: {formatAttendanceTimestamp(record.checkOutTimestamp)}</span>
  </div>;
}
const palette = ["#7c6cff","#26c6a6","#f6b84b","#ff718b","#52a8ff"];
const normalizeLeaveStatus = (status) => ({
  "Menunggu":"Pending", "Disetujui":"Approved", "Ditolak":"Not Approved",
  "Pending":"Pending", "Approved":"Approved", "Not Approved":"Not Approved"
}[status] || "Pending");
const leaveStatusClass = (status) => normalizeLeaveStatus(status)==="Approved"?"green":normalizeLeaveStatus(status)==="Pending"?"amber":"red";
const validLeaveDates = (startDate,endDate,submittedAt=currentDate()) =>
  !!startDate && !!endDate && startDate >= submittedAt && endDate >= startDate;
// Jatah cuti tetap 14 hari kerja setiap tahun kalender; sisa tahun lalu tidak dibawa.
const annualLeaveAccrued = () => 14;
const isWorkingDay = (date, holidays=[]) => { const d=new Date(`${date}T00:00:00`), day=d.getDay(); return day!==0 && day!==6 && !holidays.some(h=>(typeof h==="string"?h:h.date)===date); };
const countWorkingLeaveDays = (start,end,holidays=[]) => { if(!start||!end||end<start)return 0;let count=0;const d=new Date(`${start}T00:00:00`),last=new Date(`${end}T00:00:00`);while(d<=last){if(isWorkingDay(currentDateFrom(d),holidays))count++;d.setDate(d.getDate()+1);}return count; };
const approvedAnnualLeaveDays = (leaves,year=new Date().getFullYear(),holidays=[]) => leaves.filter(l=>l.type==="Cuti"&&normalizeLeaveStatus(l.status)==="Approved"&&String(l.startDate||"").slice(0,4)<=String(year)&&String(l.endDate||"").slice(0,4)>=String(year)).reduce((sum,l)=>{const f=new Date(`${l.startDate}T00:00:00`),t=new Date(`${l.endDate}T00:00:00`),a=new Date(`${year}-01-01T00:00:00`),b=new Date(`${year}-12-31T00:00:00`),s=f>a?f:a,e=t<b?t:b;return sum+(e>=s?countWorkingLeaveDays(currentDateFrom(s),currentDateFrom(e),holidays):0);},0);
const annualLeaveCommittedDays = (leaves,year=new Date().getFullYear(),holidays=[],excludeId=null) => leaves
  .filter(l=>l.id!==excludeId && l.type==="Cuti" && ["Approved","Pending"].includes(normalizeLeaveStatus(l.status)) && String(l.startDate||"").slice(0,4)<=String(year) && String(l.endDate||"").slice(0,4)>=String(year))
  .reduce((sum,l)=>{
    const f=new Date(`${l.startDate}T00:00:00`),t=new Date(`${l.endDate}T00:00:00`);
    const a=new Date(`${year}-01-01T00:00:00`),b=new Date(`${year}-12-31T00:00:00`);
    const start=f>a?f:a,end=t<b?t:b;
    return sum+(end>=start?countWorkingLeaveDays(currentDateFrom(start),currentDateFrom(end),holidays):0);
  },0);
const hasConflictingLeave = (leaves,employeeId,startDate,endDate,excludeId=null) => leaves.some(l=>
  l.id!==excludeId && l.employeeId===employeeId && ["Pending","Approved"].includes(normalizeLeaveStatus(l.status)) &&
  startDate<=l.endDate && endDate>=l.startDate
);
const attendanceScore = records => {
  const checkins=records.filter(r=>["Hadir","Terlambat"].includes(r.status));
  if(!checkins.length) return null;
  const onTime=checkins.filter(r=>r.status==="Hadir").length;
  return Math.round(onTime/checkins.length*100);
};
const attendanceCellStatus = record => {
  if(!record) return "no-record";
  if(record.status==="Hadir") return "on-time";
  if(record.status==="Terlambat") return "late";
  if(record.status==="Izin"||record.status==="Sakit") return "excused";
  if(record.status==="Cuti") return "leave";
  return "other";
};
const attendanceStatusForTime = time => time && time >= "08:15" ? "Terlambat" : "Hadir";
const downloadCSV = (headers,rows,filename) => {
  const safe = value => {
    const raw = String(value ?? "");
    // Prevent spreadsheet formula injection for user-controlled values.
    const protectedValue = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${protectedValue.replaceAll('"','""')}"`;
  };
  const csv = [headers,...rows].map(row=>row.map(safe).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8;"}));
  const a = document.createElement("a"); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};


async function api(path, options={}) {
  let res;
  try {
    res = await fetch(`${API}/${path}`, {
      headers: {"Content-Type":"application/json", ...(options.headers||{})},
      ...options
    });
  } catch {
    throw new Error("Tidak dapat terhubung ke JSON Server. Pastikan terminal server berjalan di port 3001 (npm run server). ");
  }
  if (!res.ok) {
    let detail = "";
    try { const body = await res.json(); detail = body?.message || body?.error || ""; } catch {}
    throw new Error(detail || `Permintaan API gagal (${res.status}) pada endpoint ${path}.`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function AppShell({session, onLogout}) {
  const [employees,setEmployees] = useState([]);
  const [attendance,setAttendance] = useState([]);
  const [leaves,setLeaves] = useState([]);
  const [holidays,setHolidays] = useState([]);
  const [loading,setLoading] = useState(true);
  const [toast,setToast] = useState("");
  const [mobile,setMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationOpen,setNotificationOpen] = useState(false);

  const refresh = async () => {
    try {
      const [e,a,l,h] = await Promise.all([api("employees"),api("attendance"),api("leaveRequests"),api("holidays")]);
      setEmployees(e); setAttendance(a); setLeaves(l); setHolidays(h); setLoading(false);
    } catch(err) { setToast(err.message); setLoading(false); }
  };
  useEffect(()=>{ refresh(); const timer=setInterval(refresh,3000); return ()=>clearInterval(timer); },[]);
  useEffect(()=>{ if(toast){ const t=setTimeout(()=>setToast(""),3500); return ()=>clearTimeout(t); } },[toast]);
  const notify = (s)=>setToast(s);
  const title = ({"/":"Overview","/employees":"Data Pegawai","/attendance":"Kehadiran","/leave":"Izin & Cuti","/reports":"Laporan"})[location.pathname] || "Overview";

  return <div className="app">
    <aside className={`sidebar ${mobile?"open":""}`}>
      <div className="brand"><div className="brand-mark"><Activity size={22}/></div><div><b>ABSEN<span>PRO</span></b><small>SMART ATTENDANCE</small></div></div>
      <div className="workspace"><div className="workspace-icon">N</div><div><b>Nusantara Corp.</b><small>Workspace perusahaan</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">MENU UTAMA</div>
      <nav>
        <NavLink to="/" end onClick={()=>setMobile(false)}><LayoutDashboard/>Overview</NavLink>
        <NavLink to="/employees" onClick={()=>setMobile(false)}><Users/>Data Pegawai</NavLink>
        <NavLink to="/attendance" onClick={()=>setMobile(false)}><CalendarCheck/>Kehadiran</NavLink>
        <NavLink to="/leave" onClick={()=>setMobile(false)}><ClipboardList/>Izin & Cuti <span className="nav-count">{leaves.filter(x=>normalizeLeaveStatus(x.status)==="Pending").length}</span></NavLink>
        <NavLink to="/reports" onClick={()=>setMobile(false)}><ChartNoAxesCombined/>Laporan</NavLink>
      </nav>
      <div className="sidebar-bottom"><div className="upgrade"><div className="upgrade-icon"><Sparkles size={17}/></div><b>Insight lebih cerdas</b><p>Pantau kedisiplinan tim lewat ringkasan kehadiran.</p><button onClick={()=>notify("Fitur insight siap dikembangkan untuk versi berikutnya.")}>Jelajahi insight <ArrowUpRight size={14}/></button></div><div className="profile"><div className="avatar admin">{initials(session?.name||"Admin")}</div><div><b>{session?.name||"Admin"}</b><small>Administrator</small></div><MoreHorizontal size={18}/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobile(!mobile)}><Menu/></button><div><div className="breadcrumb">Workspace <span>/</span> <b>{title}</b></div><h1>{title}</h1></div><div className="top-actions"><div className="date-chip"><CalendarDays size={16}/> {new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div><div className="notification-wrap"><button className="icon-btn" onClick={()=>setNotificationOpen(v=>!v)} aria-label="Buka notifikasi"><Bell size={18}/>{(leaves.filter(x=>normalizeLeaveStatus(x.status)==="Pending").length+attendance.filter(x=>x.date===today&&x.status==="Terlambat").length)>0&&<i/>}</button>{notificationOpen&&<div className="notification-popover"><b>Notifikasi</b>{leaves.filter(x=>normalizeLeaveStatus(x.status)==="Pending").length>0&&<button onClick={()=>{setNotificationOpen(false);navigate("/leave?status=Pending")}}><span className="notification-dot amber-dot"/><span><strong>{leaves.filter(x=>normalizeLeaveStatus(x.status)==="Pending").length} pengajuan menunggu</strong><small>Klik untuk meninjau pengajuan cuti.</small></span></button>}{attendance.filter(x=>x.date===today&&x.status==="Terlambat").length>0&&<button onClick={()=>{setNotificationOpen(false);navigate("/attendance")}}><span className="notification-dot"/><span><strong>{attendance.filter(x=>x.date===today&&x.status==="Terlambat").length} pegawai terlambat hari ini</strong><small>Klik untuk melihat monitoring kehadiran.</small></span></button>}{leaves.filter(x=>normalizeLeaveStatus(x.status)==="Pending").length===0&&attendance.filter(x=>x.date===today&&x.status==="Terlambat").length===0&&<p className="notification-empty">Tidak ada notifikasi yang perlu ditindaklanjuti.</p>}</div>}</div><div className="top-user"><div className="avatar admin">{initials(session?.name || "Admin")}</div><ChevronDown size={15}/></div><button className="logout-btn" onClick={onLogout}><LogOut size={15}/> Keluar</button></div></header>
      {loading ? <div className="loading"><div className="spinner"/>Memuat data ABSENPRO...</div> :
      <Routes>
        <Route path="/" element={<Dashboard employees={employees} attendance={attendance} leaves={leaves} refresh={refresh} notify={notify} session={session}/>}/>
        <Route path="/employees" element={<Employees employees={employees} refresh={refresh} notify={notify}/>}/>
        <Route path="/attendance" element={<Attendance employees={employees} attendance={attendance} refresh={refresh} notify={notify}/>}/>
        <Route path="/leave" element={<Leave employees={employees} leaves={leaves} holidays={holidays} refresh={refresh} notify={notify}/>}/>
        <Route path="/reports" element={<Reports employees={employees} attendance={attendance} leaves={leaves}/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>}
      <footer>© 2026 ABSENPRO <span>•</span> Smart Attendance Management System</footer>
    </main>
    {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}<button onClick={()=>setToast("")}><X size={15}/></button></div>}
  </div>;
}

function PageIntro({eyebrow,title,desc,action}) { return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{desc}</p></div>{action}</div>; }
function Stat({label,value,sub,icon,accent,trend,onClick}) { const I=icon; return <button type="button" className={`stat-card ${onClick?"stat-card-clickable":""}`} onClick={onClick} disabled={!onClick}><div className="stat-top"><span>{label}</span><div className={`stat-icon ${accent}`}><I size={19}/></div></div><div className="stat-value">{value}</div><div className="stat-sub"><span className="trend"><ArrowUpRight size={13}/>{trend}</span>{sub}</div></button>; }
function Badge({children}) {
  const normalized=["Menunggu","Disetujui","Ditolak","Pending","Approved","Not Approved"].includes(children)?normalizeLeaveStatus(children):children;
  const cls=normalized==="Hadir"?"green":normalized==="Terlambat"?"amber":normalized==="Izin"?"blue":normalized==="Sakit"?"red":normalized==="Cuti"?"purple":leaveStatusClass(normalized);
  return <span className={`badge ${cls}`}><i/>{normalized}</span>;
}

function Dashboard({employees,attendance,leaves,refresh,notify,session}) {
  const rows=attendance.filter(a=>a.date===today);
  const count=(s)=>rows.filter(a=>a.status===s).length;
  const present=count("Hadir")+count("Terlambat");
  const rate=employees.length?Math.round(present/employees.length*100):0;
  const lastSevenDays=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return currentDateFrom(d)});
  const chartData={labels:lastSevenDays.map(d=>new Date(`${d}T00:00:00`).toLocaleDateString("id-ID",{weekday:"short"})),datasets:[{label:"Hadir",data:lastSevenDays.map(d=>attendance.filter(a=>a.date===d&&a.status==="Hadir").length),backgroundColor:"#7869f7",borderRadius:7,barThickness:22},{label:"Terlambat",data:lastSevenDays.map(d=>attendance.filter(a=>a.date===d&&a.status==="Terlambat").length),backgroundColor:"#f4b84e",borderRadius:7,barThickness:22}]};
  const doughnut={labels:["Hadir","Terlambat","Izin","Sakit","Cuti"],datasets:[{data:[count("Hadir"),count("Terlambat"),count("Izin"),count("Sakit"),count("Cuti")],backgroundColor:palette,borderWidth:0,hoverOffset:7}]};
  const options={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"#8993a8"}},y:{grid:{color:"#edf0f6"},ticks:{color:"#8993a8",stepSize:2},beginAtZero:true}}};
  return <div className="content">
    <div className="welcome"><div><div className="welcome-kicker"><Sparkles size={14}/> PERFORMANCE SNAPSHOT</div><h2>Selamat datang, {session?.name||"Admin"} <span>✦</span></h2><p>Berikut ringkasan aktivitas dan kedisiplinan pegawai hari ini.</p></div><div className="welcome-art"><div className="orb orb1"/><div className="orb orb2"/><div className="welcome-symbol"><CalendarCheck size={38}/></div><div className="floating-tag">Live attendance <b>●</b></div></div></div>
    <div className="section-heading"><div><h3>Ringkasan hari ini</h3><p>Data kehadiran hari ini</p></div><button className="subtle-btn" onClick={refresh}><RefreshCw size={15}/> Perbarui data</button></div>
    <div className="stats-grid">
      <Stat label="Total Pegawai" value={employees.length} sub="pegawai terdaftar" icon={Users} accent="violet" trend="Data aktif" onClick={()=>navigate("/employees")}/>
      <Stat label="Hadir Hari Ini" value={present} sub={`${rate}% dari total pegawai`} icon={UserCheck} accent="green" trend={`${rate}%`} onClick={()=>navigate("/attendance")}/>
      <Stat label="Terlambat" value={count("Terlambat")} sub="perlu perhatian" icon={Timer} accent="orange" trend="Hari ini" onClick={()=>navigate("/attendance")}/>
      <Stat label="Tidak Hadir" value={count("Izin")+count("Sakit")+count("Cuti")} sub="izin, sakit & cuti" icon={UserX} accent="pink" trend="Hari ini" onClick={()=>navigate("/attendance")}/>
    </div>
    <div className="leave-overview-strip"><div><b>Manajemen cuti</b><small>Ringkasan seluruh pengajuan pegawai</small></div><div><b>{leaves.filter(x=>normalizeLeaveStatus(x.status)==="Pending").length}</b><small>Pending</small></div><div><b>{leaves.filter(x=>normalizeLeaveStatus(x.status)==="Approved").length}</b><small>Approved</small></div><div><b>{leaves.filter(x=>normalizeLeaveStatus(x.status)==="Not Approved").length}</b><small>Not Approved</small></div><Link to="/leave">Kelola pengajuan <ArrowUpRight size={14}/></Link></div>
    <div className="dashboard-grid">
      <div className="panel chart-panel"><div className="panel-head"><div><h3>Tren kehadiran</h3><p>Aktivitas tim selama 7 hari terakhir</p></div><span className="period-pill">Minggu ini <ChevronDown size={13}/></span></div><div className="chart-area"><Bar data={chartData} options={options}/></div><div className="chart-legend"><span><i className="dot violet-dot"/>Hadir</span><span><i className="dot amber-dot"/>Terlambat</span></div></div>
      <div className="panel distribution"><div className="panel-head"><div><h3>Komposisi kehadiran</h3><p>Status pegawai hari ini</p></div><MoreHorizontal size={19}/></div><div className="donut-wrap"><Doughnut data={doughnut} options={{cutout:"74%",maintainAspectRatio:false,plugins:{legend:{display:false}}}}/><div className="donut-center"><b>{rate}%</b><small>Hadir</small></div></div><div className="distribution-legend">{["Hadir","Terlambat","Izin","Sakit","Cuti"].map((x,i)=><div key={x}><span><i className="dot" style={{background:palette[i]}}/>{x}</span><b>{doughnut.datasets[0].data[i]}</b></div>)}</div></div>
    </div>
    <div className="panel table-panel"><div className="panel-head"><div><h3>Aktivitas kehadiran</h3><p>Ringkasan check-in pegawai hari ini</p></div><Link to="/attendance" className="text-link">Lihat semua <ArrowUpRight size={14}/></Link></div><AttendanceTable rows={rows.slice(0,5)} employees={employees}/></div>
    <div className="bottom-note"><div className="note-icon"><CircleAlert size={18}/></div><div><b>Perlu tindak lanjut</b><p>{leaves.filter(x=>normalizeLeaveStatus(x.status)==="Pending").length} pengajuan izin/cuti menunggu persetujuan admin.</p></div><Link to="/leave">Tinjau pengajuan <ArrowUpRight size={14}/></Link></div>
  </div>;
}

function AttendanceTable({rows,employees}) {
  const emp=(id)=>employees.find(e=>e.id===id)||{};
  return <div className="table-scroll"><table><thead><tr><th>PEGAWAI</th><th>DEPARTEMEN</th><th>CHECK-IN</th><th>CHECK-OUT</th><th>FOTO ABSENSI</th><th>TANGGAL & JAM REALTIME</th><th>STATUS</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><div className="person-cell"><div className="avatar">{initials(emp(r.employeeId).name)}</div><div><b>{emp(r.employeeId).name||r.employeeId}</b><small>{r.employeeId}</small></div></div></td><td>{emp(r.employeeId).department||"-"}</td><td className="time-cell">{r.checkIn}</td><td className="time-cell">{r.checkOut}</td><td><AttendancePhotos record={r}/></td><td><AttendanceTimes record={r}/></td><td><Badge>{r.status}</Badge></td></tr>)}</tbody></table>{rows.length===0&&<div className="empty">Belum ada data kehadiran.</div>}</div>;
}

function Employees({employees,refresh,notify}) {
  const [query,setQuery]=useState(""); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({id:"",name:"",role:"",department:"IT & Digital",email:"",phone:"",status:"Aktif"});
  const filtered=employees.filter(e=>(e.name+e.id+e.department+e.role+e.email).toLowerCase().includes(query.toLowerCase()));
  const open=(e=null)=>{setEditing(e);setForm(e?{...e}:{id:`EMP${Date.now().toString().slice(-6)}`,name:"",role:"",department:"IT & Digital",email:"",phone:"",status:"Aktif"});setModal(true);};
  const save=async(ev)=>{
    ev.preventDefault();
    const email=form.email.trim().toLowerCase();
    if(!email){notify("Email pegawai wajib diisi.");return;}
    try{
      const [allUsers,allEmployees]=await Promise.all([api("users"),api("employees")]);
      const duplicateEmployee=allEmployees.find(e=>e.id!==form.id&&(e.email||"").toLowerCase()===email);
      if(duplicateEmployee){notify("Email sudah digunakan oleh pegawai lain.");return;}
      const linkedUser=allUsers.find(u=>u.employeeId===form.id||(editing&&(u.email||"").toLowerCase()===(editing.email||"").toLowerCase()));
      const duplicateUser=allUsers.find(u=>(u.email||"").toLowerCase()===email&&u.id!==linkedUser?.id&&u.employeeId!==form.id);
      if(duplicateUser){notify("Email sudah terdaftar sebagai akun lain. Gunakan email yang berbeda.");return;}
      const employeePayload={...form,email};
      if(editing){
        await api(`employees/${encodeURIComponent(editing.id)}`,{method:"PATCH",body:JSON.stringify(employeePayload)});
        if(linkedUser){
          await api(`users/${encodeURIComponent(linkedUser.id)}`,{method:"PATCH",body:JSON.stringify({name:form.name,email,employeeId:form.id,role:"user",status:form.status})});
        }else{
          const nextId=`USR${String(Math.max(0,...allUsers.map(u=>Number(String(u.id||"").replace(/\D/g,""))||0))+1).padStart(3,"0")}`;
          await api("users",{method:"POST",body:JSON.stringify({id:nextId,name:form.name,email,password:"user123",role:"user",employeeId:form.id,status:form.status,mustChangePassword:true})});
        }
      }else{
        await api("employees",{method:"POST",body:JSON.stringify(employeePayload)});
        try{
          const nextId=`USR${String(Math.max(0,...allUsers.map(u=>Number(String(u.id||"").replace(/\D/g,""))||0))+1).padStart(3,"0")}`;
          await api("users",{method:"POST",body:JSON.stringify({id:nextId,name:form.name,email,password:"user123",role:"user",employeeId:form.id,status:form.status,mustChangePassword:true})});
        }catch(accountError){
          // Roll back employee creation so no employee exists without its login account.
          await api(`employees/${encodeURIComponent(form.id)}`,{method:"DELETE"}).catch(()=>{});
          throw new Error(`Data pegawai dibatalkan karena akun login gagal dibuat: ${accountError.message}`);
        }
      }
      await refresh();setModal(false);notify(editing?"Data pegawai dan akun login berhasil disinkronkan.":"Pegawai dan akun User berhasil dibuat. Password sementara: user123.");
    }catch(e){notify(e.message||"Gagal menyimpan data pegawai.");}
  };
  const remove=async(e)=>{
    if(!confirm(`Nonaktifkan ${e.name}? Akun login akan dinonaktifkan, tetapi riwayat kehadiran dan cuti tetap dipertahankan.`))return;
    try{
      await api(`employees/${encodeURIComponent(e.id)}`,{method:"PATCH",body:JSON.stringify({status:"Nonaktif"})});
      const users=await api("users");
      const linked=users.filter(u=>u.employeeId===e.id||(u.email||"").toLowerCase()===(e.email||"").toLowerCase());
      await Promise.all(linked.map(u=>api(`users/${encodeURIComponent(u.id)}`,{method:"PATCH",body:JSON.stringify({status:"Nonaktif",employeeId:e.id})})));
      await refresh();notify("Pegawai dan akun login berhasil dinonaktifkan. Riwayat lama tetap tersimpan.");
    }catch(err){notify(`Gagal menonaktifkan pegawai: ${err.message}`);}
  };
  return <div className="content"><PageIntro eyebrow="HUMAN RESOURCES" title="Kelola data pegawai" desc="Simpan, perbarui, dan kelola informasi seluruh anggota tim." action={<button className="primary-btn" onClick={()=>open()}><Plus size={17}/> Tambah Pegawai</button>}/><div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Cari nama, ID, atau departemen..." value={query} onChange={e=>setQuery(e.target.value)}/></div><span className="result-count">{filtered.length} pegawai ditemukan</span></div><div className="panel table-panel"><div className="panel-head"><div><h3>Direktori pegawai</h3><p>Informasi dan status kepegawaian</p></div><button className="subtle-btn" onClick={refresh}><RefreshCw size={15}/> Refresh</button></div><div className="table-scroll"><table><thead><tr><th>PEGAWAI</th><th>JABATAN</th><th>DEPARTEMEN</th><th>KONTAK</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{filtered.map(e=><tr key={e.id}><td><div className="person-cell"><div className="avatar">{initials(e.name)}</div><div><b>{e.name}</b><small>{e.id}</small></div></div></td><td>{e.role}</td><td>{e.department}</td><td><div className="contact-cell">{e.email}<small>{e.phone}</small></div></td><td><Badge>{e.status||"Aktif"}</Badge></td><td><div className="action-group"><button title="Edit" onClick={()=>open(e)}><Pencil size={15}/></button><button title="Nonaktifkan pegawai" onClick={()=>remove(e)} disabled={e.status==="Nonaktif"}><UserX size={15}/></button></div></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty">Pegawai tidak ditemukan.</div>}</div></div>{modal&&<Modal title={editing?"Edit Pegawai":"Tambah Pegawai Baru"} close={()=>setModal(false)}><form onSubmit={save} className="form-grid"><Field label="ID Pegawai"><input value={form.id} disabled/></Field><Field label="Nama lengkap"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nama pegawai"/></Field><Field label="Jabatan"><input required value={form.role} onChange={e=>setForm({...form,role:e.target.value})} placeholder="Contoh: Staff Administrasi"/></Field><Field label="Departemen"><select value={form.department} onChange={e=>setForm({...form,department:e.target.value})}>{["IT & Digital","Human Capital","Finance","Marketing","Operations","Sales"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Email"><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field><Field label="Nomor telepon"><input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field><Field label="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Aktif</option><option>Cuti</option><option>Nonaktif</option></select></Field>{!editing&&<div className="span-2 leave-balance-hint">Akun User akan dibuat otomatis dengan email di atas dan password sementara <b>user123</b>.</div>}<div className="form-actions"><button type="button" className="subtle-btn" onClick={()=>setModal(false)}>Batal</button><button className="primary-btn"><Check size={16}/> Simpan Data</button></div></form></Modal>}</div>;
}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}

function CameraAttendance({action,onClose,onCapture}){
  const videoRef=useRef(null), streamRef=useRef(null), [cameraError,setCameraError]=useState(""), [ready,setReady]=useState(false), [busy,setBusy]=useState(false);
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        if(!navigator.mediaDevices?.getUserMedia) throw new Error("Browser tidak mendukung kamera. Gunakan Chrome melalui localhost atau HTTPS.");
        const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}},audio:false});
        streamRef.current=stream;
        if(active && videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play();setReady(true);}
      }catch(e){if(active)setCameraError(e.name==="NotAllowedError"?"Izin kamera ditolak. Izinkan akses kamera pada browser lalu coba lagi.":e.message||"Kamera tidak dapat diakses.");}
    })();
    return ()=>{active=false;streamRef.current?.getTracks().forEach(t=>t.stop());};
  },[]);
  const capture=async()=>{
    if(!videoRef.current || !ready)return;
    setBusy(true);
    try{
      const video=videoRef.current, canvas=document.createElement("canvas");
      const scale=Math.min(1,900/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
      const ctx=canvas.getContext("2d");ctx.drawImage(video,0,0,canvas.width,canvas.height);
      const now=new Date(), stamp=now.toLocaleString("id-ID",{dateStyle:"full",timeStyle:"medium"});
      const band= Math.max(48,Math.round(canvas.height*.12));ctx.fillStyle="rgba(15,23,42,.78)";ctx.fillRect(0,canvas.height-band,canvas.width,band);
      ctx.fillStyle="#ffffff";ctx.font=`600 ${Math.max(15,Math.round(canvas.width*.025))}px Arial`;ctx.fillText(`ABSENPRO • ${action}`,18,canvas.height-band+Math.round(band*.42));
      ctx.font=`${Math.max(13,Math.round(canvas.width*.019))}px Arial`;ctx.fillText(stamp,18,canvas.height-12);
      const photo=canvas.toDataURL("image/jpeg",.58);
      if(photo.length>90000) throw new Error("Ukuran foto masih terlalu besar. Coba ambil foto dengan pencahayaan cukup dan latar sederhana.");
      await onCapture({photo,timestamp:now.toISOString()});
    }catch(e){setCameraError(e.message||"Foto gagal diproses.");}finally{setBusy(false);}
  };
  return <div className="camera-backdrop"><div className="camera-modal"><div className="camera-head"><div><b>Verifikasi foto {action}</b><small>Pastikan wajah terlihat jelas sebelum mengambil foto.</small></div><button onClick={onClose} aria-label="Tutup"><X/></button></div>{cameraError&&<div className="auth-error"><CircleAlert size={16}/>{cameraError}</div>}<div className="camera-view">{!cameraError&&<video ref={videoRef} autoPlay playsInline muted/>}{!ready&&!cameraError&&<div className="camera-loading">Mengaktifkan kamera...</div>}</div><div className="camera-actions"><button className="subtle-btn" onClick={onClose}>Batal</button><button className="auth-submit" disabled={!ready||busy} onClick={capture}><Camera size={17}/>{busy?"Menyimpan foto...":"Ambil foto & catat absensi"}</button></div><p className="camera-note">Tanggal dan jam perangkat akan dicetak langsung pada foto dan disimpan bersama catatan absensi.</p></div></div>;
}
function Modal({title,close,children}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal"><div className="modal-head"><div><h3>{title}</h3><p>Lengkapi informasi pada formulir berikut.</p></div><button onClick={close}><X/></button></div>{children}</div></div>}

function Attendance({employees,attendance,refresh,notify}) {
  const [date,setDate]=useState(today); const [modal,setModal]=useState(false); const [form,setForm]=useState({employeeId:"",date:today,checkIn:"08:00",checkOut:"17:00",status:"Hadir",note:""});
  const rows=attendance.filter(a=>a.date===date);
  const save=async(e)=>{e.preventDefault();try{const payload={...form,status:attendanceStatusForTime(form.checkIn)};const existing=attendance.find(a=>a.employeeId===form.employeeId&&a.date===form.date);if(existing)await api(`attendance/${existing.id}`,{method:"PATCH",body:JSON.stringify(payload)});else await api("attendance",{method:"POST",body:JSON.stringify(payload)});await refresh();setModal(false);notify("Data kehadiran berhasil disimpan.");}catch(err){notify(err.message)}};
  const quick=(emp)=>async()=>{try{const existing=attendance.find(a=>a.employeeId===emp.id&&a.date===date);if(existing){await api(`attendance/${existing.id}`,{method:"PATCH",body:JSON.stringify({checkOut:"17:00"})});}else{await api("attendance",{method:"POST",body:JSON.stringify({employeeId:emp.id,date,checkIn:"08:00",checkOut:"-",status:attendanceStatusForTime("08:00"),note:"Check-in demo"})});}await refresh();notify(existing?"Check-out berhasil dicatat.":"Check-in berhasil dicatat.");}catch(err){notify(err.message)}};
  return <div className="content"><PageIntro eyebrow="DAILY ATTENDANCE" title="Monitoring kehadiran" desc="Pantau check-in, check-out, dan status kehadiran pegawai." action={<button className="primary-btn" onClick={()=>{setForm({...form,employeeId:employees[0]?.id||"",date});setModal(true)}}><Plus size={17}/> Input Kehadiran</button>}/><div className="attendance-tools"><label className="date-input"><CalendarDays size={16}/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><button className="subtle-btn" onClick={refresh}><RefreshCw size={15}/> Perbarui</button><span className="result-count">{rows.length} catatan pada tanggal ini</span></div><div className="stats-grid compact"><Stat label="Hadir" value={rows.filter(x=>x.status==="Hadir").length} sub="tepat waktu" icon={UserCheck} accent="green" trend="Hari ini"/><Stat label="Terlambat" value={rows.filter(x=>x.status==="Terlambat").length} sub="melewati jam masuk" icon={Timer} accent="orange" trend="Hari ini"/><Stat label="Izin / Sakit" value={rows.filter(x=>["Izin","Sakit"].includes(x.status)).length} sub="tidak masuk kerja" icon={UserX} accent="pink" trend="Hari ini"/><Stat label="Cuti" value={rows.filter(x=>x.status==="Cuti").length} sub="cuti terjadwal" icon={CalendarDays} accent="violet" trend="Hari ini"/></div><div className="panel table-panel"><div className="panel-head"><div><h3>Log kehadiran</h3><p>Catatan harian seluruh pegawai</p></div><button className="subtle-btn" onClick={()=>downloadCSV(["ID Pegawai","Nama","Tanggal","Check-in","Check-out","Status"],rows.map(r=>[r.employeeId,employees.find(e=>e.id===r.employeeId)?.name||"",r.date,r.checkIn,r.checkOut,r.status]),"absenpro-kehadiran-harian.csv")}><Download size={15}/> Export CSV</button></div><AttendanceTable rows={rows} employees={employees}/></div><div className="panel quick-panel"><div className="panel-head"><div><h3>Quick attendance</h3><p>Simulasi check-in / check-out untuk demo presentasi</p></div><span className="live-pill">● LIVE DEMO</span></div><div className="quick-grid">{employees.filter(e=>e.status==="Aktif").slice(0,6).map(e=><div className="quick-person" key={e.id}><div className="person-cell"><div className="avatar">{initials(e.name)}</div><div><b>{e.name}</b><small>{e.id}</small></div></div><button className="mini-action" onClick={quick(e)}><Clock3 size={14}/> {attendance.some(a=>a.employeeId===e.id&&a.date===date)?"Check-out":"Check-in"}</button></div>)}</div></div>{modal&&<Modal title="Input Kehadiran" close={()=>setModal(false)}><form onSubmit={save} className="form-grid"><Field label="Pegawai"><select required value={form.employeeId} onChange={e=>setForm({...form,employeeId:e.target.value})}>{employees.map(x=><option value={x.id}>{x.name} — {x.id}</option>)}</select></Field><Field label="Tanggal"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field><Field label="Jam masuk"><input type="time" value={form.checkIn} onChange={e=>setForm({...form,checkIn:e.target.value})}/></Field><Field label="Jam keluar"><input type="time" value={form.checkOut} onChange={e=>setForm({...form,checkOut:e.target.value})}/></Field><Field label="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{["Hadir","Terlambat","Izin","Sakit","Cuti"].map(x=><option>{x}</option>)}</select></Field><Field label="Catatan"><input value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></Field><div className="form-actions"><button type="button" className="subtle-btn" onClick={()=>setModal(false)}>Batal</button><button className="primary-btn"><Check size={16}/> Simpan Kehadiran</button></div></form></Modal>}</div>;
}

function Leave({employees,leaves,holidays=[],refresh,notify}) {
  const [modal,setModal]=useState(false),[query,setQuery]=useState("");
  const [form,setForm]=useState({employeeId:employees[0]?.id||"",type:"Cuti",startDate:today,endDate:today,reason:""});
  const [holidayModal,setHolidayModal]=useState(false),[holidayForm,setHolidayForm]=useState({date:today,name:""});
  const [statusFilter,setStatusFilter]=useState(()=>new URLSearchParams(window.location.search).get("status")||"All");
  const pending=leaves.filter(x=>normalizeLeaveStatus(x.status)==="Pending").length;
  const approved=leaves.filter(x=>normalizeLeaveStatus(x.status)==="Approved").length;
  const rejected=leaves.filter(x=>normalizeLeaveStatus(x.status)==="Not Approved").length;
  const filtered=leaves.filter(l=>{
    const e=employees.find(x=>x.id===l.employeeId)||{};
    const match=(e.name||"").toLowerCase().includes(query.toLowerCase()) || String(l.employeeId).toLowerCase().includes(query.toLowerCase());
    return match&&(statusFilter==="All"||normalizeLeaveStatus(l.status)===statusFilter);
  });
  const decide=async(item,status)=>{
    const next=normalizeLeaveStatus(status);
    if(next==="Approved" && item.type==="Cuti"){
      if(hasConflictingLeave(leaves,item.employeeId,item.startDate,item.endDate,item.id)){
        notify("Tidak dapat menyetujui: periode ini bertabrakan dengan cuti lain yang sudah disetujui.");return;
      }
      const requested=countWorkingLeaveDays(item.startDate,item.endDate,holidays);
      const committed=annualLeaveCommittedDays(leaves.filter(l=>l.employeeId===item.employeeId),new Date().getFullYear(),holidays,item.id);
      if(committed+requested>14){
        notify(`Tidak dapat menyetujui: sisa kuota setelah memperhitungkan pengajuan lain hanya ${Math.max(0,14-committed)} hari kerja.`);return;
      }
    }
    if(!window.confirm(`Ubah status pengajuan ${item.type} milik ${employees.find(e=>e.id===item.employeeId)?.name||item.employeeId} menjadi "${next}"?`))return;
    try{await api(`leaveRequests/${item.id}`,{method:"PATCH",body:JSON.stringify({status:next,decisionAt:new Date().toISOString()})});await refresh();notify(`Status pengajuan berhasil diperbarui menjadi ${next}.`)}
    catch(e){notify(`Gagal memperbarui status: ${e.message}`)}
  };
  const submit=async(e)=>{
    e.preventDefault();
    if(!validLeaveDates(form.startDate,form.endDate,today)){notify("Tanggal mulai harus hari ini atau setelahnya, dan tanggal selesai tidak boleh sebelum tanggal mulai.");return;}if(form.type==="Cuti"&&countWorkingLeaveDays(form.startDate,form.endDate,holidays)===0){notify("Periode cuti tidak memiliki hari kerja yang dapat dihitung.");return;}
    if(hasConflictingLeave(leaves,form.employeeId,form.startDate,form.endDate)){notify("Pengajuan bertabrakan dengan periode izin/cuti lain yang masih Pending atau sudah Approved.");return;}
    if(form.type==="Cuti"){const committed=annualLeaveCommittedDays(leaves.filter(l=>l.employeeId===form.employeeId),new Date().getFullYear(),holidays);const remaining=Math.max(0,14-committed);const requested=countWorkingLeaveDays(form.startDate,form.endDate,holidays);if(requested>remaining){notify(`Kuota cuti yang belum terpakai atau dipesan hanya ${remaining} hari kerja. Pengajuan Pending ikut diperhitungkan agar kuota tidak terpakai ganda.`);return;}}
    try{await api("leaveRequests",{method:"POST",body:JSON.stringify({...form,submittedAt:today,createdAt:new Date().toISOString(),status:"Pending"})});await refresh();setModal(false);notify("Pengajuan berhasil dibuat dengan status Pending.");}
    catch(err){notify(err.message)}
  };
  return <div className="content">
    <PageIntro eyebrow="TIME OFF MANAGEMENT" title="Manajemen cuti pegawai" desc="Tinjau pengajuan, cari pegawai, dan tetapkan keputusan cuti." action={<button className="primary-btn" onClick={()=>{setForm({...form,employeeId:employees[0]?.id||"",startDate:today,endDate:today});setModal(true)}}><Plus size={17}/> Buat Pengajuan</button>}/>
    <div className="stats-grid compact">
      <Stat label="Total Pengajuan" value={leaves.length} sub="seluruh pengajuan" icon={ClipboardList} accent="violet" trend="All time" onClick={()=>setStatusFilter("All")}/>
      <Stat label="Pending" value={pending} sub="menunggu keputusan" icon={Timer} accent="orange" trend="Pending" onClick={()=>setStatusFilter("Pending")}/>
      <Stat label="Approved" value={approved} sub="pengajuan disetujui" icon={UserCheck} accent="green" trend="Approved" onClick={()=>setStatusFilter("Approved")}/>
      <Stat label="Not Approved" value={rejected} sub="pengajuan tidak disetujui" icon={UserX} accent="pink" trend="Rejected" onClick={()=>setStatusFilter("Not Approved")}/>
    </div>
    <div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Cari nama atau ID pegawai..." value={query} onChange={e=>setQuery(e.target.value)}/></div><select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="All">Semua status</option><option>Pending</option><option>Approved</option><option>Not Approved</option></select><span className="result-count">{filtered.length} pengajuan</span></div>
    <div className="panel table-panel"><div className="panel-head"><div><h3>Daftar pengajuan cuti</h3><p>Admin dapat menyetujui atau tidak menyetujui pengajuan Pending.</p></div><span className="period-pill">{pending} perlu ditinjau</span></div>
      <div className="table-scroll"><table><thead><tr><th>PEGAWAI</th><th>JENIS</th><th>PERIODE</th><th>TGL PENGAJUAN</th><th>ALASAN</th><th>STATUS</th><th>KEPUTUSAN</th></tr></thead><tbody>
      {filtered.map(l=>{const e=employees.find(x=>x.id===l.employeeId)||{};const st=normalizeLeaveStatus(l.status);return <tr key={l.id}><td><div className="person-cell"><div className="avatar">{initials(e.name)}</div><div><b>{e.name||l.employeeId}</b><small>{l.employeeId}</small></div></div></td><td>{l.type}</td><td className="time-cell">{l.startDate}<small>s/d {l.endDate}</small></td><td>{l.submittedAt||l.createdAt?.slice(0,10)||"-"}</td><td className="reason">{l.reason}</td><td><Badge>{st}</Badge></td><td>{st==="Pending"?<div className="decision"><button className="approve" onClick={()=>decide(l,"Approved")}><Check size={14}/> Setujui</button><button className="reject" onClick={()=>decide(l,"Not Approved")}><X size={14}/> Tolak</button></div>:<span className="muted">Selesai</span>}</td></tr>})}
      </tbody></table>{filtered.length===0&&<div className="empty">Tidak ada pengajuan yang sesuai filter.</div>}</div>
    </div>
    <div className="panel holiday-panel"><div className="panel-head"><div><h3>Kalender hari libur</h3><p>Hari libur yang didaftarkan tidak mengurangi jatah cuti tahunan.</p></div><button className="subtle-btn" onClick={()=>setHolidayModal(true)}><Plus size={15}/> Tambah Hari Libur</button></div><div className="holiday-list">{holidays.length?[...holidays].sort((a,b)=>a.date.localeCompare(b.date)).map(h=><div className="holiday-item" key={h.id}><span><b>{h.date}</b><small>{h.name}</small></span><button title="Hapus hari libur" onClick={async()=>{if(!window.confirm(`Hapus hari libur ${h.name}?`))return;try{await api(`holidays/${h.id}`,{method:"DELETE"});await refresh();notify("Hari libur dihapus.");}catch(e){notify(e.message)}}}><Trash2 size={15}/></button></div>):<div className="empty">Belum ada hari libur. Admin dapat mendaftarkan hari libur nasional atau perusahaan.</div>}</div></div>
    {holidayModal&&<Modal title="Tambah Hari Libur" close={()=>setHolidayModal(false)}><form className="form-grid" onSubmit={async e=>{e.preventDefault();try{if(holidays.some(h=>h.date===holidayForm.date)){notify("Tanggal tersebut sudah terdaftar.");return;}await api("holidays",{method:"POST",body:JSON.stringify({...holidayForm,id:`HOL${Date.now()}`})});await refresh();setHolidayModal(false);setHolidayForm({date:today,name:""});notify("Hari libur berhasil ditambahkan.");}catch(err){notify(err.message)}}}><Field label="Tanggal libur"><input type="date" required value={holidayForm.date} onChange={e=>setHolidayForm({...holidayForm,date:e.target.value})}/></Field><Field label="Nama hari libur"><input required value={holidayForm.name} onChange={e=>setHolidayForm({...holidayForm,name:e.target.value})} placeholder="Contoh: Hari Kemerdekaan"/></Field><div className="form-actions"><button type="button" className="subtle-btn" onClick={()=>setHolidayModal(false)}>Batal</button><button className="primary-btn"><Check size={16}/> Simpan</button></div></form></Modal>}
    {modal&&<Modal title="Buat Pengajuan Cuti Pegawai" close={()=>setModal(false)}><form onSubmit={submit} className="form-grid">
      <Field label="Pegawai"><select required value={form.employeeId} onChange={e=>setForm({...form,employeeId:e.target.value})}>{employees.map(x=><option key={x.id} value={x.id}>{x.name} — {x.id}</option>)}</select></Field>
      <Field label="Jenis pengajuan"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{["Cuti","Izin","Sakit"].map(x=><option key={x}>{x}</option>)}</select></Field>
      <Field label="Tanggal mulai"><input type="date" required min={today} value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value,endDate:form.endDate<form.startDate?e.target.value:form.endDate})}/></Field>
      <Field label="Tanggal selesai"><input type="date" required min={form.startDate||today} value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></Field>
      <div className="span-2"><Field label="Alasan"><textarea required rows="3" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Tuliskan alasan pengajuan..."/></Field></div>
      <div className="form-actions"><button type="button" className="subtle-btn" onClick={()=>setModal(false)}>Batal</button><button className="primary-btn"><Check size={16}/> Kirim Pengajuan</button></div>
    </form></Modal>}
  </div>;
}

function Reports({employees,attendance,leaves}) {
  const [selectedEmployee,setSelectedEmployee]=useState(employees[0]?.id||"");
  const [selectedMonth,setSelectedMonth]=useState(currentDate().slice(0,7));
  useEffect(()=>{if(!employees.some(e=>e.id===selectedEmployee)&&employees[0])setSelectedEmployee(employees[0].id)},[employees,selectedEmployee]);
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return currentDateFrom(d)});
  const vals=days.map(d=>attendance.filter(a=>a.date===d&&["Hadir","Terlambat"].includes(a.status)).length);
  const data={labels:days.map(d=>new Date(`${d}T00:00:00`).toLocaleDateString("id-ID",{day:"numeric",month:"short"})),datasets:[{label:"Pegawai hadir",data:vals,borderColor:"#7869f7",backgroundColor:"rgba(120,105,247,.12)",fill:true,tension:.4,pointRadius:4,pointBackgroundColor:"#7869f7"}]};
  const downloadAttendance=()=>downloadCSV(["ID Pegawai","Nama","Tanggal","Check In","Check Out","Status","Catatan"],attendance.map(a=>[a.employeeId,employees.find(e=>e.id===a.employeeId)?.name||"",a.date,a.checkIn,a.checkOut,a.status,a.note||""]),"absenpro-laporan-kehadiran.csv");
  const downloadLeave=()=>downloadCSV(["ID Pegawai","Nama","Jenis","Tanggal Mulai","Tanggal Selesai","Tanggal Pengajuan","Alasan","Status"],leaves.map(l=>[l.employeeId,employees.find(e=>e.id===l.employeeId)?.name||"",l.type,l.startDate,l.endDate,l.submittedAt||l.createdAt?.slice(0,10)||"",l.reason,normalizeLeaveStatus(l.status)]),"absenpro-laporan-cuti.csv");
  const [year,month]=selectedMonth.split("-").map(Number);
  const monthStart=new Date(year,month-1,1), monthDays=new Date(year,month,0).getDate();
  const offset=(monthStart.getDay()+6)%7;
  const monthRecords=attendance.filter(a=>a.employeeId===selectedEmployee&&a.date?.startsWith(selectedMonth));
  const byDate=new Map(monthRecords.map(r=>[r.date,r]));
  const scoreRows=employees.map(emp=>{
    const records=attendance.filter(a=>a.employeeId===emp.id&&a.date?.startsWith(String(year)));
    const checkins=records.filter(a=>["Hadir","Terlambat"].includes(a.status));
    const late=checkins.filter(a=>a.status==="Terlambat").length;
    const score=attendanceScore(records);
    return {emp,score,late,total:checkins.length,onTime:checkins.length-late};
  }).sort((a,b)=>(b.score??-1)-(a.score??-1));
  const options={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"#8993a8"}},y:{beginAtZero:true,ticks:{stepSize:2,color:"#8993a8"},grid:{color:"#edf0f6"}}}};
  return <div className="content"><PageIntro eyebrow="ANALYTICS & INSIGHTS" title="Laporan & analitik HR" desc="Pantau kehadiran, kedisiplinan, dan pola absensi pegawai berdasarkan data aktual." action={<div className="report-export-actions"><button className="primary-btn" onClick={downloadAttendance}><Download size={17}/> Export Kehadiran CSV</button><button className="subtle-btn" onClick={downloadLeave}><Download size={17}/> Export Cuti CSV</button></div>}/>
    <div className="report-highlight"><div><span className="eyebrow">ATTENDANCE RATE HARI INI</span><div className="big-rate">{employees.length?Math.round(attendance.filter(a=>a.date===today&&["Hadir","Terlambat"].includes(a.status)).length/employees.length*100):0}<small>%</small></div><p>Persentase pegawai dengan catatan hadir atau terlambat hari ini.</p></div><div className="highlight-icon"><ChartNoAxesCombined size={45}/></div></div>
    <div className="dashboard-grid report-grid"><div className="panel chart-panel"><div className="panel-head"><div><h3>Tren kehadiran mingguan</h3><p>Jumlah pegawai hadir per hari, 7 hari terakhir</p></div><span className="period-pill">7 hari terakhir</span></div><div className="chart-area"><Line data={data} options={options}/></div></div><div className="panel report-summary"><h3>Ringkasan data</h3><div className="summary-row"><span>Total pegawai</span><b>{employees.length}</b></div><div className="summary-row"><span>Total catatan absensi</span><b>{attendance.length}</b></div><div className="summary-row"><span>Total pengajuan</span><b>{leaves.length}</b></div><div className="summary-row"><span>Pengajuan menunggu</span><b className="amber-text">{leaves.filter(x=>normalizeLeaveStatus(x.status)==="Pending").length}</b></div><div className="summary-tip"><FileSpreadsheet size={17}/><span>Unduh data untuk analisis lanjutan di spreadsheet.</span></div></div></div>
    <div className="panel insight-panel"><div className="panel-head"><div><h3>Employee Attendance Score</h3><p>Skor = persentase check-in tepat waktu dari seluruh catatan Hadir dan Terlambat pada tahun {year}. Izin, sakit, cuti, dan hari tanpa catatan tidak menjadi penalti.</p></div><span className="period-pill">Tahun {year}</span></div><div className="table-scroll"><table><thead><tr><th>PEGAWAI</th><th>SKOR</th><th>TEPAT WAKTU</th><th>TERLAMBAT</th><th>TOTAL CHECK-IN</th></tr></thead><tbody>{scoreRows.map(({emp,score,late,total,onTime})=><tr key={emp.id}><td><div className="person-cell"><div className="avatar">{initials(emp.name)}</div><div><b>{emp.name}</b><small>{emp.department||emp.id}</small></div></div></td><td>{score===null?<span className="muted">Belum ada data</span>:<div className="score-cell"><b className={score>=95?"score-high":score>=80?"score-mid":"score-low"}>{score}/100</b><div className="score-track"><i style={{width:`${score}%`}}/></div></div>}</td><td>{onTime}</td><td>{late}</td><td>{total}</td></tr>)}</tbody></table>{!attendance.length&&<div className="empty">Belum ada data absensi untuk menghitung skor.</div>}</div></div>
    <div className="panel insight-panel"><div className="panel-head"><div><h3>Attendance Heatmap</h3><p>Kalender status absensi per pegawai. Kotak abu-abu berarti belum ada catatan, bukan otomatis dianggap absen.</p></div><div className="heatmap-controls"><select className="filter-select" value={selectedEmployee} onChange={e=>setSelectedEmployee(e.target.value)}>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select><input className="month-input" type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}/></div></div><div className="heatmap-legend"><span><i className="heat on-time"/>Tepat waktu</span><span><i className="heat late"/>Terlambat</span><span><i className="heat excused"/>Izin/Sakit</span><span><i className="heat leave"/>Cuti</span><span><i className="heat no-record"/>Tidak ada catatan</span></div><div className="heatmap-grid"><div className="heatmap-weekday">Sen</div><div className="heatmap-weekday">Sel</div><div className="heatmap-weekday">Rab</div><div className="heatmap-weekday">Kam</div><div className="heatmap-weekday">Jum</div><div className="heatmap-weekday">Sab</div><div className="heatmap-weekday">Min</div>{Array.from({length:offset},(_,i)=><span key={`blank-${i}`} className="heatmap-blank"/>)}{Array.from({length:monthDays},(_,i)=>{const day=i+1,date=`${selectedMonth}-${String(day).padStart(2,"0")}`,record=byDate.get(date),kind=attendanceCellStatus(record);return <div key={date} className={`heatmap-day ${kind}`} title={`${date}: ${record?.status||"Tidak ada catatan"}`}><b>{day}</b>{record&&<small>{record.checkIn&&record.checkIn!=="-"?record.checkIn:"—"}</small>}</div>})}</div><div className="heatmap-footnote">Pegawai: <b>{employees.find(e=>e.id===selectedEmployee)?.name||"-"}</b> • {monthRecords.length} catatan pada bulan ini.</div></div>
    <div className="panel table-panel"><div className="panel-head"><div><h3>Rekap per departemen</h3><p>Jumlah anggota dan catatan kehadiran hari ini</p></div></div><div className="table-scroll"><table><thead><tr><th>DEPARTEMEN</th><th>JUMLAH PEGAWAI</th><th>HADIR</th><th>TINGKAT KEHADIRAN</th></tr></thead><tbody>{[...new Set(employees.map(e=>e.department))].map(d=>{const es=employees.filter(e=>e.department===d);const n=attendance.filter(a=>a.date===today&&es.some(e=>e.id===a.employeeId)&&["Hadir","Terlambat"].includes(a.status)).length;return <tr key={d}><td><b>{d}</b></td><td>{es.length}</td><td>{n}</td><td><div className="progress-cell"><div className="progress"><i style={{width:`${es.length?n/es.length*100:0}%`}}/></div><b>{es.length?Math.round(n/es.length*100):0}%</b></div></td></tr>})}</tbody></table></div></div></div>;
}

function currentDate(){ const d=new Date(); return currentDateFrom(d); }
function currentDateFrom(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function AppGate(){
  const [session,setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem("absenpro_session")||"null")}catch{return null}});
  const [authLoading,setAuthLoading]=useState(false);
  const [authError,setAuthError]=useState("");
  const login=async(email,password,role)=>{
    setAuthLoading(true);setAuthError("");
    try{
      let users=await api("users");
      const normalizedEmail=email.trim().toLowerCase();
      let found=users.find(u=>(u.email||"").toLowerCase()===normalizedEmail&&u.password===password&&u.role===role);
      // One-time compatibility path: employees added before automatic account creation
      // can receive a linked demo account when they use the configured temporary password.
      if(!found&&role==="user"&&password==="user123"){
        const employees=await api("employees");
        const legacyEmployee=employees.find(e=>(e.email||"").toLowerCase()===normalizedEmail);
        if(legacyEmployee&&legacyEmployee.status!=="Nonaktif"){
          let linked=users.find(u=>u.employeeId===legacyEmployee.id);
          if(!linked){
            const nextId=`USR${String(Math.max(0,...users.map(u=>Number(String(u.id||"").replace(/\D/g,""))||0))+1).padStart(3,"0")}`;
            linked=await api("users",{method:"POST",body:JSON.stringify({id:nextId,name:legacyEmployee.name,email:normalizedEmail,password:"user123",role:"user",employeeId:legacyEmployee.id,status:legacyEmployee.status||"Aktif",mustChangePassword:true})});
            users=[...users,linked];
          }
          found=linked.email?.toLowerCase()===normalizedEmail&&linked.password===password?linked:null;
        }
      }
      if(!found) throw new Error("Akun tidak ditemukan. Pastikan Admin sudah menambahkan pegawai dan gunakan password sementara user123, atau hubungi Admin.");
      if(found.status==="Nonaktif") throw new Error("Akun ini sudah dinonaktifkan. Hubungi administrator.");
      let employeeId=found.employeeId||null;
      let accountName=found.name||"Pengguna ABSENPRO";
      if(role==="user"){
        const employees=await api("employees");
        // Repair legacy accounts that were created without employeeId by matching their email.
        let employee=employeeId?employees.find(e=>e.id===employeeId):null;
        if(!employee) employee=employees.find(e=>(e.email||"").toLowerCase()===normalizedEmail);
        if(!employee) throw new Error("Akun login belum terhubung dengan data pegawai. Minta Admin memeriksa ID dan email pegawai.");
        if(employee.status==="Nonaktif"){
          await api(`users/${encodeURIComponent(found.id)}`,{method:"PATCH",body:JSON.stringify({status:"Nonaktif",employeeId:employee.id})}).catch(()=>{});
          throw new Error("Data pegawai berstatus Nonaktif. Akun tidak dapat digunakan untuk login.");
        }
        employeeId=employee.id;accountName=employee.name||found.name;
        // Keep account identity synchronized with the employee master record.
        if(found.employeeId!==employee.id||found.email!==employee.email||found.name!==employee.name||found.status!==employee.status){
          await api(`users/${encodeURIComponent(found.id)}`,{method:"PATCH",body:JSON.stringify({employeeId:employee.id,email:employee.email,name:employee.name,status:employee.status,role:"user"})});
        }
      }
      const safe={id:found.id,name:accountName,email:role==="user"?normalizedEmail:found.email,role:found.role,employeeId};
      localStorage.setItem("absenpro_session",JSON.stringify(safe));setSession(safe);
    }catch(e){setAuthError(e.message||"Login gagal. Silakan coba kembali.");}
    finally{setAuthLoading(false)}
  };
  const logout=()=>{localStorage.removeItem("absenpro_session");setSession(null)};
  if(!session)return <LoginScreen onLogin={login} loading={authLoading} error={authError}/>;
  if(session.role==="admin")return <BrowserRouter><AppShell session={session} onLogout={logout}/></BrowserRouter>;
  if(session.role==="user"&&session.employeeId)return <EmployeePortal session={session} onLogout={logout}/>;
  return <div className="auth-screen"><div className="auth-card"><h2>Sesi akun tidak valid</h2><p>Akun belum memiliki hubungan yang benar dengan data pegawai. Silakan login ulang atau hubungi Admin.</p><button className="auth-submit" onClick={logout}>Kembali ke login</button></div></div>;
}
function LoginScreen({onLogin,loading,error}){
  const [role,setRole]=useState("user");const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [show,setShow]=useState(false);
  const submit=e=>{e.preventDefault();onLogin(email,password,role)};
  return <div className="auth-screen"><div className="auth-decoration auth-decoration-one"/><div className="auth-decoration auth-decoration-two"/><div className="auth-card">
    <div className="auth-brand"><div className="brand-mark"><Activity size={23}/></div><div><b>ABSEN<span>PRO</span></b><small>SMART ATTENDANCE</small></div></div>
    <div className="auth-heading"><span className="eyebrow">SELAMAT DATANG</span><h1>Masuk ke akun Anda</h1><p>Kelola kehadiran dengan lebih mudah dan teratur.</p></div>
    <div className="role-switch"><button className={role==="user"?"selected":""} onClick={()=>setRole("user")} type="button"><Users size={17}/> Login User</button><button className={role==="admin"?"selected":""} onClick={()=>setRole("admin")} type="button"><Settings size={17}/> Login Admin</button></div>
    <form onSubmit={submit} className="auth-form"><label className="field"><span>Email</span><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@perusahaan.id"/></label><label className="field"><span>Password</span><div className="password-wrap"><input type={show?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan password"/><button type="button" onClick={()=>setShow(!show)}>{show?"Sembunyikan":"Lihat"}</button></div></label>
      {error&&<div className="auth-error"><CircleAlert size={16}/>{error}</div>}<button className="auth-submit" disabled={loading}>{loading?"Memeriksa akun...":`Masuk sebagai ${role==="admin"?"Admin":"User"}`} <ArrowUpRight size={17}/></button></form>
    <div className="auth-foot">ABSENPRO <span>•</span> Sistem Absensi dan Kehadiran Pegawai</div>
  </div><div className="auth-side-note"><div className="auth-side-icon"><CalendarCheck size={25}/></div><b>Satu sistem, dua akses.</b><p>Admin mengelola data perusahaan. Pegawai mengelola kehadiran dan pengajuan pribadi.</p></div></div>;
}
function EmployeePortal({session,onLogout}){
  const [employee,setEmployee]=useState(null),[attendance,setAttendance]=useState([]),[leaves,setLeaves]=useState([]),[holidays,setHolidays]=useState([]),[loading,setLoading]=useState(true),[toast,setToast]=useState(""),[page,setPage]=useState("home"),[modal,setModal]=useState(false),[cameraOpen,setCameraOpen]=useState(false),[cameraAction,setCameraAction]=useState("Check-in");
  const [form,setForm]=useState({type:"Cuti",startDate:currentDate(),endDate:currentDate(),reason:""});const [myLeaveFilter,setMyLeaveFilter]=useState("All");const [profileEditing,setProfileEditing]=useState(false);const [profileForm,setProfileForm]=useState({phone:"",address:"",emergencyContact:""});const [profileSaving,setProfileSaving]=useState(false);
  const todayDate=currentDate();
  const refresh=async()=>{try{const [emp,att,lv,hd]=await Promise.all([api(`employees/${encodeURIComponent(session.employeeId)}`),api(`attendance?employeeId=${encodeURIComponent(session.employeeId)}`),api(`leaveRequests?employeeId=${encodeURIComponent(session.employeeId)}`),api("holidays")]);setEmployee(emp||null);setAttendance(att);setLeaves(lv);setHolidays(hd);}catch(e){setToast(e.message)}finally{setLoading(false)}};
  useEffect(()=>{refresh();const timer=setInterval(refresh,3000);return()=>clearInterval(timer)},[]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(""),3200);return()=>clearTimeout(t)}},[toast]);
  const todayRecord=attendance.find(a=>a.date===todayDate);
  const leaveEntitlement=annualLeaveAccrued();
  const leaveUsed=approvedAnnualLeaveDays(leaves,new Date().getFullYear(),holidays);
  const leaveReserved=annualLeaveCommittedDays(leaves,new Date().getFullYear(),holidays);
  const leavePendingReserved=Math.max(0,leaveReserved-leaveUsed);
  const leaveRemaining=Math.max(0,leaveEntitlement-leaveReserved);
  const myFilteredLeaves=leaves.filter(l=>myLeaveFilter==="All"||normalizeLeaveStatus(l.status)===myLeaveFilter);
  const doCheck=()=>{
    if(todayRecord && todayRecord.checkOut!=="-"){setToast("Absensi hari ini sudah lengkap.");return;}
    setCameraAction(!todayRecord?"Check-in":"Check-out");setCameraOpen(true);
  };
  const saveCameraAttendance=async({photo,timestamp})=>{
    const now=new Date(timestamp), time=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`, date=currentDateFrom(now);
    if(date!==todayDate) throw new Error("Tanggal perangkat berubah. Muat ulang halaman sebelum mengambil absensi.");
    if(!todayRecord){
      await api("attendance",{method:"POST",body:JSON.stringify({employeeId:session.employeeId,date,checkIn:time,checkOut:"-",status:attendanceStatusForTime(time),note:"Foto verifikasi check-in",checkInPhoto:photo,checkInTimestamp:timestamp})});
      setToast("Check-in berhasil. Foto dan waktu berhasil disimpan.");
    }else if(todayRecord.checkOut==="-"){
      await api(`attendance/${todayRecord.id}`,{method:"PATCH",body:JSON.stringify({checkOut:time,checkOutPhoto:photo,checkOutTimestamp:timestamp})});
      setToast("Check-out berhasil. Foto dan waktu berhasil disimpan.");
    }else{setToast("Absensi hari ini sudah lengkap.");}
    setCameraOpen(false);await refresh();
  };
  const submitLeave=async e=>{e.preventDefault();if(!validLeaveDates(form.startDate,form.endDate,todayDate)){setToast("Tanggal mulai harus hari ini atau setelahnya, dan tanggal selesai tidak boleh sebelum tanggal mulai.");return;}if(hasConflictingLeave(leaves,session.employeeId,form.startDate,form.endDate)){setToast("Periode ini bertabrakan dengan pengajuan lain yang masih Pending atau sudah Approved.");return;}if(form.type==="Cuti"&&countWorkingLeaveDays(form.startDate,form.endDate,holidays)>Math.max(0,14-annualLeaveCommittedDays(leaves,new Date().getFullYear(),holidays))){setToast("Kuota cuti tidak mencukupi setelah memperhitungkan pengajuan Pending dan Approved.");return;}try{await api("leaveRequests",{method:"POST",body:JSON.stringify({...form,employeeId:session.employeeId,submittedAt:todayDate,createdAt:new Date().toISOString(),status:"Pending"})});setModal(false);setForm({type:"Cuti",startDate:todayDate,endDate:todayDate,reason:""});await refresh();setToast("Pengajuan cuti berhasil dikirim dengan status Pending.");}catch(e){setToast(e.message)}};
  const beginProfileEdit=()=>{setProfileForm({phone:employee.phone||"",address:employee.address||"",emergencyContact:employee.emergencyContact||""});setProfileEditing(true)};
  const saveProfile=async e=>{e.preventDefault();setProfileSaving(true);try{await api(`employees/${encodeURIComponent(session.employeeId)}`,{method:"PATCH",body:JSON.stringify({...profileForm,profileUpdatedAt:new Date().toISOString()})});await refresh();setProfileEditing(false);setToast("Informasi profil berhasil diperbarui.");}catch(err){setToast(`Gagal memperbarui profil: ${err.message}`)}finally{setProfileSaving(false)}};
  if(loading)return <div className="loading"><div className="spinner"/>Memuat akun pegawai...</div>;
  if(!employee)return <div className="auth-screen"><div className="auth-card"><h2>Akun belum terhubung</h2><p>Akun ini belum terhubung dengan data pegawai. Hubungi administrator.</p><button className="auth-submit" onClick={onLogout}>Kembali ke login</button></div></div>;
  const nav=[["home","Beranda",LayoutDashboard],["attendance","Riwayat Kehadiran",CalendarCheck],["leave","Izin & Cuti",ClipboardList],["profile","Profil Saya",Users]];
  return <div className="user-app"><aside className="user-sidebar"><div className="auth-brand"><div className="brand-mark"><Activity size={22}/></div><div><b>ABSEN<span>PRO</span></b><small>EMPLOYEE PORTAL</small></div></div><div className="user-welcome"><div className="avatar">{initials(employee.name)}</div><b>{employee.name}</b><small>{employee.department}</small><span>{employee.id}</span></div><div className="nav-label">MENU PEGAWAI</div><nav>{nav.map(([id,label,Icon])=><button key={id} className={page===id?"active":""} onClick={()=>setPage(id)}><Icon size={18}/>{label}</button>)}</nav><button className="user-logout" onClick={onLogout}><LogOut size={17}/> Keluar</button></aside>
    <main className="user-main"><header className="user-topbar"><div><span className="eyebrow">EMPLOYEE SELF SERVICE</span><h1>{nav.find(x=>x[0]===page)?.[1]}</h1></div><div className="user-top-right"><span className="user-status"><i/> Akun Pegawai</span><div className="avatar">{initials(employee.name)}</div></div></header>
    {page==="home"&&<div className="user-content"><div className="user-hero"><div><span>ABSENPRO • PORTAL PEGAWAI</span><h2>Halo, {employee.name.split(" ")[0]} 👋</h2><p>Semoga hari Anda produktif. Jangan lupa mencatat kehadiran hari ini.</p></div><div className="hero-calendar"><CalendarDays size={28}/><b>{new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long"})}</b><small>{new Date().toLocaleDateString("id-ID",{weekday:"long",year:"numeric"})}</small></div></div>
      <div className="user-stat-grid"><div className="user-stat leave-balance-card"><span>Sisa cuti tahunan</span><b>{leaveRemaining} hari</b><small>Jatah {leaveEntitlement} hari • Approved {leaveUsed} • Pending dipesan {leavePendingReserved} hari</small></div><div className="user-stat"><span>Status hari ini</span><b>{todayRecord?(todayRecord.checkOut!=="-"?"Selesai":"Sudah check-in"):"Belum absen"}</b><small>{todayRecord?.checkIn&&`Masuk pukul ${todayRecord.checkIn}`}</small></div><div className="user-stat"><span>Total catatan hadir</span><b>{attendance.filter(a=>["Hadir","Terlambat"].includes(a.status)).length}</b><small>Riwayat kehadiran Anda</small></div><div className="user-stat"><span>Pending</span><b>{leaves.filter(l=>normalizeLeaveStatus(l.status)==="Pending").length}</b><small>Menunggu keputusan</small></div><div className="user-stat"><span>Approved</span><b>{leaves.filter(l=>normalizeLeaveStatus(l.status)==="Approved").length}</b><small>Pengajuan disetujui</small></div><div className="user-stat"><span>Not Approved</span><b>{leaves.filter(l=>normalizeLeaveStatus(l.status)==="Not Approved").length}</b><small>Pengajuan tidak disetujui</small></div></div>
      <div className="user-panel"><div><span className="eyebrow">ABSENSI HARI INI</span><h3>Catat kehadiran Anda</h3><p>{todayRecord?`Jam masuk: ${todayRecord.checkIn} • Jam keluar: ${todayRecord.checkOut}`:"Anda belum melakukan check-in hari ini."}</p></div><button className="auth-submit attendance-submit" onClick={doCheck} disabled={!!todayRecord&&todayRecord.checkOut!=="-"}><Clock3 size={17}/>{!todayRecord?"Check-in sekarang":todayRecord.checkOut==="-"?"Check-out sekarang":"Absensi selesai"}</button></div>
      <div className="user-panel"><div><span className="eyebrow">LAYANAN PEGAWAI</span><h3>Pengajuan izin atau cuti</h3><p>Kirim pengajuan dan pantau status persetujuan dari administrator.</p></div><button className="user-outline-btn" onClick={()=>setModal(true)}><Plus size={16}/> Buat pengajuan</button></div>
    </div>}
    {page==="attendance"&&<div className="user-content"><div className="user-panel-block"><h3>Riwayat kehadiran</h3><p>Catatan absensi yang tercatat atas akun Anda.</p><div className="table-scroll"><table><thead><tr><th>TANGGAL</th><th>CHECK-IN</th><th>CHECK-OUT</th><th>FOTO ABSENSI</th><th>TANGGAL & JAM</th><th>STATUS</th></tr></thead><tbody>{[...attendance].sort((a,b)=>b.date.localeCompare(a.date)).map(a=><tr key={a.id}><td>{a.date}</td><td>{a.checkIn}</td><td>{a.checkOut}</td><td><AttendancePhotos record={a}/></td><td><AttendanceTimes record={a}/></td><td><Badge>{a.status}</Badge></td></tr>)}</tbody></table>{attendance.length===0&&<div className="empty">Belum ada riwayat kehadiran.</div>}</div></div></div>}
    {page==="leave"&&<div className="user-content"><div className="user-panel-block"><div className="section-heading"><div><h3>Pengajuan izin & cuti</h3><p>Riwayat dan status pengajuan Anda.</p></div><select className="filter-select" value={myLeaveFilter} onChange={e=>setMyLeaveFilter(e.target.value)}><option value="All">Semua status</option><option>Pending</option><option>Approved</option><option>Not Approved</option></select><button className="user-outline-btn" onClick={()=>setModal(true)}><Plus size={16}/> Ajukan</button></div><div className="table-scroll"><table><thead><tr><th>JENIS</th><th>PERIODE</th><th>TGL PENGAJUAN</th><th>ALASAN</th><th>STATUS</th></tr></thead><tbody>{myFilteredLeaves.map(l=><tr key={l.id}><td>{l.type}</td><td>{l.startDate} s/d {l.endDate}</td><td>{l.submittedAt||l.createdAt?.slice(0,10)||"-"}</td><td>{l.reason}</td><td><Badge>{normalizeLeaveStatus(l.status)}</Badge></td></tr>)}</tbody></table>{myFilteredLeaves.length===0&&<div className="empty">Tidak ada pengajuan pada status ini.</div>}</div></div></div>}
    {page==="profile"&&<div className="user-content"><div className="user-panel-block profile-detail"><div className="profile-heading"><div><div className="avatar">{initials(employee.name)}</div><h2>{employee.name}</h2><p>{employee.role} • {employee.department}</p></div>{!profileEditing&&<button className="user-outline-btn" onClick={beginProfileEdit}><Pencil size={15}/> Edit informasi kontak</button>}</div>{!profileEditing?<><div className="profile-detail-grid"><div><small>ID PEGAWAI</small><b>{employee.id}</b></div><div><small>EMAIL AKUN</small><b>{employee.email}</b></div><div><small>NOMOR TELEPON</small><b>{employee.phone||"-"}</b></div><div><small>ALAMAT</small><b>{employee.address||"Belum diisi"}</b></div><div><small>KONTAK DARURAT</small><b>{employee.emergencyContact||"Belum diisi"}</b></div><div><small>STATUS</small><b>{employee.status}</b></div></div><p className="profile-note">Nama, email akun, ID, departemen, dan status dikelola Admin. Anda dapat memperbarui informasi kontak pribadi.</p></>:<form className="profile-edit-form" onSubmit={saveProfile}><Field label="Nomor telepon"><input required inputMode="tel" maxLength="20" value={profileForm.phone} onChange={e=>setProfileForm({...profileForm,phone:e.target.value})}/></Field><Field label="Alamat"><textarea rows="2" maxLength="250" value={profileForm.address} onChange={e=>setProfileForm({...profileForm,address:e.target.value})} placeholder="Alamat domisili"/></Field><Field label="Kontak darurat"><input maxLength="80" value={profileForm.emergencyContact} onChange={e=>setProfileForm({...profileForm,emergencyContact:e.target.value})} placeholder="Nama dan nomor kontak darurat"/></Field><div className="form-actions"><button type="button" className="subtle-btn" onClick={()=>setProfileEditing(false)}>Batal</button><button className="primary-btn" disabled={profileSaving}><Check size={15}/>{profileSaving?"Menyimpan...":"Simpan perubahan"}</button></div></form>}</div></div>}
    </main>{modal&&<Modal title="Ajukan Izin / Cuti" close={()=>setModal(false)}><div className="leave-balance-hint">Kuota cuti yang masih tersedia: <b>{leaveRemaining} hari</b>. Pengajuan Pending ikut memesan kuota. Perhitungan hanya menghitung Senin–Jumat; Sabtu, Minggu, dan hari libur terdaftar tidak dihitung.</div><form onSubmit={submitLeave} className="form-grid"><Field label="Jenis pengajuan"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{["Izin","Sakit","Cuti"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Tanggal mulai"><input type="date" required min={todayDate} value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></Field><Field label="Tanggal selesai"><input type="date" required min={form.startDate} value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></Field>{form.type==="Cuti"&&<div className="span-2 leave-balance-hint">Hari kerja yang dipotong: <b>{countWorkingLeaveDays(form.startDate,form.endDate,holidays)} hari</b>. Akhir pekan dan hari libur terdaftar tidak dihitung.</div>}<div className="span-2"><Field label="Alasan"><textarea required rows="3" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Tuliskan alasan pengajuan..."/></Field></div><div className="form-actions"><button type="button" className="subtle-btn" onClick={()=>setModal(false)}>Batal</button><button className="primary-btn"><Check size={16}/> Kirim pengajuan</button></div></form></Modal>}{cameraOpen&&<CameraAttendance action={cameraAction} onClose={()=>setCameraOpen(false)} onCapture={saveCameraAttendance}/>}{toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}<button onClick={()=>setToast("")}><X size={14}/></button></div>}</div>;
}
createRoot(document.getElementById("root")).render(<AppGate/>);

