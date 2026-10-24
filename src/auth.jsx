import {createContext,useContext,useEffect,useState} from "react";
import {Navigate} from "react-router-dom";
import {onAuthStateChanged,signOut} from "firebase/auth";
import {ref,get} from "firebase/database";
import {auth,db} from "./firebase";

const A=createContext({});
export const useAuth=()=>useContext(A);
export const homeFor=r=>r==="admin"?"/dashboard":"/gate";

export function AuthProvider({children}){
  const [s,setS]=useState({user:null,role:null,loading:true});
  useEffect(()=>onAuthStateChanged(auth,async u=>{
    if(!u)return setS({user:null,role:null,loading:false});
    setS(x=>({...x,user:u,loading:true}));
    let role=null;
    try{role=(await get(ref(db,`roles/${u.uid}`))).val()?.role||null;}catch{}
    setS({user:u,role,loading:false});
  }),[]);
  return <A.Provider value={{...s,logout:()=>signOut(auth)}}>{children}</A.Provider>;
}

export function Guard({roles,children}){
  const {user,role,loading,logout}=useAuth();
  if(loading)return <div className="login"><div className="skel" style={{width:240}}/></div>;
  if(!user)return <Navigate to="/" replace/>;
  if(!["admin","guard"].includes(role))return <div className="login"><div className="card"><h2>Access pending</h2>
    <p className="mut">{user.email} can’t use the web app yet. Ask an administrator to assign a role.</p>
    <button className="btn" onClick={logout}>Log out</button></div></div>;
  if(!roles.includes(role))return <Navigate to={homeFor(role)} replace/>;
  return children;
}
