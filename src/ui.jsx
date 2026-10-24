import {createContext,useContext,useEffect,useState} from "react";
import {Link,NavLink} from "react-router-dom";
import logo from "./assets/image.png";
import {useAuth} from "./auth";

const T=createContext(()=>{});
export const useToast=()=>useContext(T);
export function ToastProvider({children}){
  const [list,setList]=useState([]);
  const push=(msg,type="ok")=>{
    const id=Math.random();
    setList(l=>[...l,{id,msg,type}]);
    setTimeout(()=>setList(l=>l.filter(t=>t.id!==id)),3500);
  };
  return <T.Provider value={push}>{children}
    <div className="toasts" role="status" aria-live="polite">{list.map(t=><div key={t.id} className={"toast "+t.type}>{t.msg}</div>)}</div>
  </T.Provider>;
}

const NAV={
  admin:[["/dashboard","Dashboard"],["/activities","Activity"],["/users","Users"],["/cards","Cards"],["/accounts","Accounts"]],
  guard:[["/gate","Gate"],["/activities","Activity"]]};
export function Layout({title,actions,children}){
  const {role,user,logout}=useAuth();
  return <div data-role={role}>
    <header className="top"><div className="bar">
      <Link to={role==="admin"?"/dashboard":"/gate"} className="brand"><img src={logo} alt=""/><b>STI ParkTags</b></Link>
      <nav>{(NAV[role]||[]).map(([to,l])=><NavLink key={to} to={to}>{l}</NavLink>)}</nav>
      <span className="who" title={user?.email}>{role}</span>
      <button className="btn sm out" onClick={logout}>Log out</button>
    </div></header>
    <main className="page">
      <div className="phead"><h1>{title}</h1><div className="actions">{actions}</div></div>
      {children}
    </main></div>;
}

export function Modal({title,onClose,children}){
  useEffect(()=>{
    const k=e=>e.key==="Escape"&&onClose();
    addEventListener("keydown",k);document.body.style.overflow="hidden";
    return()=>{removeEventListener("keydown",k);document.body.style.overflow="";};
  },[onClose]);
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mhead"><h3>{title}</h3><button className="x" onClick={onClose} aria-label="Close">×</button></div>
      <div className="mbody">{children}</div>
    </div></div>;
}
export const Confirm=({title,label,onClose,onOk,children})=>
  <Modal title={title} onClose={onClose}><p>{children}</p>
    <div className="mact"><button className="btn" onClick={onClose}>Cancel</button><button className="btn danger" onClick={onOk}>{label}</button></div>
  </Modal>;
export const Field=({label,hint,children})=><label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;
export const Badge=({cls="",children})=><span className={"badge "+cls}>{children}</span>;
export const Stat=({label,value})=><div className="card stat"><span>{label}</span><b>{value}</b></div>;

export function Table({cols,rows,loading,empty}){
  if(loading)return <div>{[0,1,2,3,4].map(i=><div key={i} className="skel"/>)}</div>;
  if(!rows.length)return <div className="empty">{empty}</div>;
  return <div className="scroll"><table>
    <thead><tr>{cols.map(c=><th key={c.h}>{c.h}</th>)}</tr></thead>
    <tbody>{rows.map(r=><tr key={r.id}>{cols.map(c=><td key={c.h} data-label={c.h}>{c.c(r)}</td>)}</tr>)}</tbody>
  </table></div>;
}
export const Pager=({p,total})=><div className="pager">
  <label>Show <select className="inp sm" value={p.size} onChange={e=>p.setSize(+e.target.value)}>
    {[10,25,50,100,0].map(n=><option key={n} value={n}>{n||"All"}</option>)}</select></label>
  <span>{total} result{total===1?"":"s"}</span>
  {p.size>0&&<div className="pn">
    <button className="btn sm" disabled={p.page<=1} onClick={()=>p.setPage(p.page-1)}>‹ Prev</button>
    <span>{p.page} / {p.pages}</span>
    <button className="btn sm" disabled={p.page>=p.pages} onClick={()=>p.setPage(p.page+1)}>Next ›</button>
  </div>}
</div>;

const res={Entry:"ok",Exit:"",Denied:"bad"};
export const activityCols=[
  {h:"User ID",c:r=>r.student_id||"N/A"},{h:"Name",c:r=>r.name},{h:"Vehicle ID",c:r=>r.card_uid||"N/A"},
  {h:"Type",c:r=>r.vtype},{h:"Plate",c:r=>r.plate},{h:"Time",c:r=>r.time},
  {h:"Result",c:r=><span><Badge cls={res[r.label]}>{r.label}</Badge>{r.needs_details&&<> <Badge cls="warn">Needs details</Badge></>}</span>}];
export const withDetails=(cols,fn)=>[...cols,{h:"",c:r=>r.needs_details?<button className="btn sm pri" onClick={()=>fn(r)}>Add details</button>:null}];
export const userCols=[
  {h:"Name",c:r=><Link to={`/users/${r.id}`}>{r.name||"N/A"}</Link>},{h:"ID",c:r=>r.id},
  {h:"Type",c:r=><Badge>{r.kind==="staff"?"Staff":"Student"}</Badge>},
  {h:"Course / Dept",c:r=>r.course||r.department||"N/A"},
  {h:"Year",c:r=>r.kind==="staff"?"—":r.year_level||"—"},
  {h:"Vehicles",c:r=>r.count?`${r.count} vehicle${r.count>1?"s":""}`:"None"},
  {h:"Status",c:r=>r.count?<Badge cls={r.parked?"ok":"mut"}>{r.parked?"Parked":"Not parked"}</Badge>:<Badge cls="mut">No vehicle</Badge>},
  {h:"",c:r=><Link className="btn sm" to={`/users/${r.id}`}>View</Link>}];
