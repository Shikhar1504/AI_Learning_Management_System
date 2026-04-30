import DashboardHeader from "../dashboard/_components/DashboardHeader";

function CourseViewLayout({ children }) {
  return (
    <div className="min-h-screen bg-transparent relative text-slate-100">
      <div className="relative z-10">
        <DashboardHeader />
        <div className="mx-1 md:mx-16 lg:px-20 mt-10 mb-10">{children}</div>
      </div>
    </div>
  );
}

{
  /*This layout wraps all dynamic course pages and automatically updates "children" when the route (course[id]) changes, keeping the header persistent.*/
}

export default CourseViewLayout;
