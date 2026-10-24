import {useMemo,useState} from "react";
import {useUsers,usePaged} from "../lib";
import {Layout,Field,Table,Pager,userCols} from "../ui";
import {UserModal} from "../forms";

const init={kind:"all",course:"all",year:"all",from:"",to:""};

export default function Users(){
  const {rows,loading}=useUsers();
  const [q,setQ]=useState(""),[f,setF]=useState(init),[open,setOpen]=useState(false);
  const set=k=>e=>setF(s=>({...s,[k]:e.target.value}));
  const courses=useMemo(()=>[...new Set(rows.map(r=>r.course).filter(Boolean))].sort(),[rows]);
  const list=useMemo(()=>{
    const s=q.trim().toLowerCase();
    return rows.filter(r=>
      (!s||[r.name,r.id,r.email].some(x=>String(x||"").toLowerCase().includes(s)))&&
      (f.kind==="all"||r.kind===f.kind)&&(f.course==="all"||r.course===f.course)&&
      (f.year==="all"||String(r.year_level)===f.year)&&
      (!f.from||(r.date_registered||"")>=f.from)&&(!f.to||(r.date_registered||"")<=f.to));
  },[rows,q,f]);
  const p=usePaged(list);
  return <Layout title="Registered users" actions={<button className="btn pri" onClick={()=>setOpen(true)}>+ Add user</button>}>
    <div className="card">
      <div className="filters">
        <input className="inp wide" type="search" placeholder="Search name, ID or email…" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search"/>
        <Field label="Type"><select className="inp" value={f.kind} onChange={set("kind")}><option value="all">Students and staff</option><option value="student">Students</option><option value="staff">Staff</option></select></Field>
        <Field label="Course / Dept"><select className="inp" value={f.course} onChange={set("course")}><option value="all">All</option>{courses.map(c=><option key={c}>{c}</option>)}</select></Field>
        <Field label="Year level"><select className="inp" value={f.year} onChange={set("year")}><option value="all">All</option>{[1,2,3,4,5].map(y=><option key={y} value={y}>Year {y}</option>)}</select></Field>
        <Field label="Registered from"><input className="inp" type="date" value={f.from} onChange={set("from")}/></Field>
        <Field label="To"><input className="inp" type="date" value={f.to} onChange={set("to")}/></Field>
        <button className="btn" onClick={()=>{setF(init);setQ("");}}>Reset filters</button>
      </div>
      <div className="chips"><span>Total <b>{rows.length}</b></span><span>Students <b>{rows.filter(r=>r.kind==="student").length}</b></span>
        <span>Staff <b>{rows.filter(r=>r.kind==="staff").length}</b></span><span>Matching <b>{list.length}</b></span></div>
      <Table cols={userCols} rows={p.items} loading={loading} empty="No users match your filters."/>
      <Pager p={p} total={list.length}/>
    </div>
    {open&&<UserModal onClose={()=>setOpen(false)}/>}
  </Layout>;
}
