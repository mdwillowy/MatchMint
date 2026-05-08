import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";

function AppShell() {
  return (
    <>
      <AppNavbar />
      <Outlet />
    </>
  );
}

export default AppShell;
