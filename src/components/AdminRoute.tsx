import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setStatus("denied");

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setStatus(!error && data ? "allowed" : "denied");
    };
    check();
  }, []);

  if (status === "loading") return <div className="p-10 text-center text-muted-foreground">Checking access…</div>;
  if (status === "denied") return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default AdminRoute;