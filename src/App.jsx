import {HashRouter,Routes,Route,Navigate} from "react-router-dom";
import {ToastProvider} from "./ui";
import {AuthProvider,Guard} from "./auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Gate from "./pages/Gate";
import Activities from "./pages/Activities";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Cards from "./pages/Cards";
import Accounts from "./pages/Accounts";

const ADMIN=["admin"],ALL=["admin","guard"];
const G=(roles,el)=><Guard roles={roles}>{el}</Guard>;

export default function App(){
  return <ToastProvider><AuthProvider><HashRouter><Routes>
    <Route path="/" element={<Login/>}/>
    <Route path="/gate" element={G(ALL,<Gate/>)}/>
    <Route path="/activities" element={G(ALL,<Activities/>)}/>
    <Route path="/dashboard" element={G(ADMIN,<Dashboard/>)}/>
    <Route path="/users" element={G(ADMIN,<Users/>)}/>
    <Route path="/users/:id" element={G(ADMIN,<Profile/>)}/>
    <Route path="/cards" element={G(ADMIN,<Cards/>)}/>
    <Route path="/accounts" element={G(ADMIN,<Accounts/>)}/>
    <Route path="*" element={<Navigate to="/"/>}/>
  </Routes></HashRouter></AuthProvider></ToastProvider>;
}
