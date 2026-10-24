import {useState} from "react";
import {Link} from "react-router-dom";
import {useActivities,today} from "../lib";
import {Layout,Stat,Table,activityCols,withDetails} from "../ui";
import {ActivityModal} from "../forms";

export default function Gate(){
  const {rows,students,loading}=useActivities();
  const [log,setLog]=useState(null),[open,setOpen]=useState(false);
  const pend=rows.filter(r=>r.needs_details),td=today();
  const parked=Object.values(students).flatMap(s=>Object.values(s.vehicles||{})).filter(x=>x.current_status==="parked").length;
  const v=x=>loading?"…":x,close=()=>{setLog(null);setOpen(false);};
  const pc=withDetails([{h:"Time",c:r=>r.time},{h:"Card",c:r=>r.card_uid||"N/A"},{h:"Direction",c:r=>r.label},{h:"Reader",c:r=>r.reader||"N/A"}],setLog);
  return <Layout title="Gate" actions={<button className="btn pri" onClick={()=>setOpen(true)}>+ Manual entry</button>}>
    <div className="stats">
      <Stat label="Needs details" value={v(pend.length)}/>
      <Stat label="Vehicles parked" value={v(parked)}/>
      <Stat label="Today’s activity" value={v(rows.filter(r=>r.date===td).length)}/>
    </div>
    <section className="card"><h2>Gate card entries needing details</h2>
      <Table cols={pc} rows={pend} loading={loading} empty="All gate entries have details."/></section>
    <section className="card"><h2>Latest activity <Link to="/activities">See all →</Link></h2>
      <Table cols={activityCols} rows={rows.filter(r=>r.granted).slice(0,8)} loading={loading} empty="No activity yet."/></section>
    {(open||log)&&<ActivityModal students={students} log={log} onClose={close}/>}
  </Layout>;
}
