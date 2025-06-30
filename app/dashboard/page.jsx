import React from "react";
import WelcomeBanner from "./_components/WelcomeBanner";
import CourseList from "./_components/CourseList";

{/*This file is specific to the route and dynamically changes based on the user, data, or interactions.*/}
function Dashboard() {
  return (
    <div>
      <WelcomeBanner />
      <CourseList />
    </div>
  );
}

export default Dashboard;
