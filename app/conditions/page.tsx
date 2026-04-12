import { supabase } from"@/lib/supabase";
import ConditionsList from"./ConditionsList";

export const metadata = {
 title:"Conditions",
};

export default async function ConditionsPage() {
 const { data: conditions, error } = await supabase
 .from("conditions")
 .select("id, name, slug")
 .order("name");

 if (error) {
 console.error("Failed to fetch conditions:", error.message);
 }

 return (
 <main className="flex-1" style={{ backgroundColor:"#F5F3EF" }}>
 {/* Page header */}
 <div style={{ backgroundColor:"#fff", borderBottom:"1px solid #E0DDD8" }}>
 <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color:"#999" }}>
 <span>Home</span>
 <span className="mx-2">›</span>
 <span style={{ color:"#4D5E4D" }}>Conditions</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
 style={{ color:"#1a1a1a" }}
 >
 Conditions
 </h1>
 <p className="text-base max-w-xl" style={{ color:"#555" }}>
 Conditions with active drug repurposing signals in the database.
 </p>
 </div>
 </div>

 <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <ConditionsList conditions={conditions ?? []} />
 </div>
 </main>
 );
}
