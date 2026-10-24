import {useState} from "react";
import {Link} from "react-router-dom";
import {useActivities} from "../lib";
import {Layout,Stat,Table,activityCols,userCols} from "../ui";
import {UserModal,ActivityModal} from "../forms";

export default function Dashboard(){
  const {rows,students,loading}=useActivities();
  const [denied,setDenied]=useState(false),[m,setM]=useState(null);
  const users=Object.entries(students).map(([id,s])=>({...s,id,kind:id.startsWith("E")||s.department?"staff":"student",
    count:Object.keys(s.vehicles||{}).length,parked:Object.values(s.vehicles||{}).some(v=>v.current_status==="parked")}));
  const vehicles=users.reduce((n,u)=>n+u.count,0),parked=users.filter(u=>u.parked).length;
  const recent=users.sort((a,b)=>(b.date_registered||"").localeCompare(a.date_registered||"")).slice(0,5);
  const v=x=>loading?"…":x,close=()=>setM(null),pend=rows.filter(r=>r.needs_details).length;
  return <Layout title="Dashboard" actions={<>
      <button className="btn" onClick={()=>setM("act")}>Manual entry</button>
      <button className="btn pri" onClick={()=>setM("user")}>+ Add user</button></>}>
    {pend>0&&<Link className="alert" to="/activities">⚠ {pend} gate card {pend===1?"entry needs":"entries need"} details →</Link>}
    <div className="stats">
      <Stat label="Registered users" value={v(users.length)}/>
      <Stat label="Users currently parked" value={v(parked)}/>
      <Stat label="Vehicles registered" value={v(vehicles)}/>
    </div>
    <section className="card">
      <h2>Recent parking activity
        <span><label className="chk"><input type="checkbox" checked={denied} onChange={e=>setDenied(e.target.checked)}/> Show denied</label>
        {" "}<Link to="/activities">See all →</Link></span></h2>
      <Table cols={activityCols} rows={rows.filter(r=>denied||r.granted).slice(0,5)} loading={loading} empty="No activity yet."/>
    </section>
    <section className="card">
      <h2>Recently registered users <Link to="/users">See all →</Link></h2>
      <Table cols={userCols} rows={recent} loading={loading} empty="No users yet."/>
    </section>
    {m==="user"&&<UserModal onClose={close}/>}
    {m==="act"&&<ActivityModal students={students} onClose={close}/>}
  </Layout>;
}
