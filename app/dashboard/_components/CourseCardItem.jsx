import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { format } from "date-fns";

function CourseCardItem({ course }) {
  const currentDate = format(new Date(), "dd MMM yyyy"); // "16 Feb 2025"
  return (
    <div className="border rounded-lg shadow-lg p-5">
      <div>
        <div className="flex justify-between items-center">
          <Image src={"/knowledge.png"} alt="other" width={50} height={50} />
          <h2 className="text-[10px] p-1 px-2 rounded-full bg-primary text-white">
            {currentDate}
          </h2>
        </div>

        <h2 className="mt-3 font-medium text-lg">
          {course?.courseLayout?.courseTitle ||
            course?.courseLayout?.course_title}
        </h2>
        <p className="text-sm line-clamp-2 text-gray-500 mt-2">
          {course?.courseLayout?.summary}
        </p>

        <div className="mt-3 flex justify-end">
          {course?.status == "Generating" ? (
            <h2 className="text-sm p-1 px-2 flex gap-2 items-center rounded-full bg-gray-400 text-white">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Generating...
            </h2>
          ) : (
            <Link href={"/course/" + course?.courseId}>
              {" "}
              {/* Link to the course page with the course ID when the user click view */}
              <Button>View</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseCardItem;
