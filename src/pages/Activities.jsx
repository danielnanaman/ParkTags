import {useMemo,useState} from "react";
import {useActivities,usePaged,today} from "../lib";
import {Layout,Field,Table,Pager,activityCols,withDetails} from "../ui";
import {ActivityModal} from "../forms";

const init={kind:"all",res:"granted",veh:"all",from:"",to:""};
const cols=[...activityCols,{h:"Reader",c:r=>r.reader||"N/A"},{h:"Remarks",c:r=>r.remarks||"—"}];

export default function Activities(){
  const {rows,students,loading}=useActivities();
  const [q,setQ]=useState(""),[f,setF]=useState(init),[open,setOpen]=useState(false),[log,setLog]=useState(null);
  const set=k=>e=>setF(s=>({...s,[k]:e.target.value}));
  const list=useMemo(()=>{
    const s=q.trim().toLowerCase();
    return rows.filter(r=>
      (!s||[r.name,r.student_id,r.plate].some(x=>String(x||"").toLowerCase().includes(s)))&&
      (f.kind==="all"||r.kind===f.kind)&&
      (f.res==="all"||(f.res==="granted"?r.granted:f.res==="DENIED"?!r.granted:f.res==="PENDING"?!!r.needs_details:r.granted&&r.access_type===f.res))&&
      (f.veh==="all"||(f.veh==="Other"?!["car","motorcycle"].includes(r.vtype.toLowerCase()):r.vtype.toLowerCase()===f.veh))&&
      (!f.from||r.date>=f.from)&&(!f.to||r.date<=f.to));
  },[rows,q,f]);
  const p=usePaged(list),td=today();
  return <Layout title="Parking activity" actions={<button className="btn pri" onClick={()=>setOpen(true)}>+ Manual entry</button>}>
    <div className="card">
      <div className="filters">
        <input className="inp wide" type="search" placeholder="Search name, ID or plate…" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search"/>
        <Field label="User"><select className="inp" value={f.kind} onChange={set("kind")}><option value="all">All users</option><option value="student">Students</option><option value="staff">Staff</option><option value="visitor">Visitors</option></select></Field>
        <Field label="Result"><select className="inp" value={f.res} onChange={set("res")}><option value="granted">Entries and exits</option><option value="ENTRANCE">Entries only</option><option value="EXIT">Exits only</option><option value="PENDING">Needs details</option><option value="DENIED">Denied only</option><option value="all">Everything</option></select></Field>
        <Field label="Vehicle"><select className="inp" value={f.veh} onChange={set("veh")}><option value="all">All vehicles</option><option value="car">Car</option><option value="motorcycle">Motorcycle</option><option value="Other">Other</option></select></Field>
        <Field label="From"><input className="inp" type="date" value={f.from} onChange={set("from")}/></Field>
        <Field label="To"><input className="inp" type="date" value={f.to} onChange={set("to")}/></Field>
        <button className="btn" onClick={()=>{setF(init);setQ("");}}>Reset filters</button>
      </div>
      <div className="chips"><span>Total <b>{rows.length}</b></span><span>Today <b>{rows.filter(r=>r.date===td).length}</b></span><span>Matching <b>{list.length}</b></span></div>
      <Table cols={withDetails(cols,setLog)} rows={p.items} loading={loading} empty="No activity matches your filters."/>
      <Pager p={p} total={list.length}/>
    </div>
    {(open||log)&&<ActivityModal students={students} log={log} onClose={()=>{setOpen(false);setLog(null);}}/>}
  </Layout>;
}
