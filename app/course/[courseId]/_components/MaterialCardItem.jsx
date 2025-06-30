"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { RefreshCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function MaterialCardItem({ item, studyTypeContent, course, refreshData }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const GenerateContent = async () => {
    // toast(" Generating your content...");
    toast({
      title: "Generating content...",
    });

    setLoading(true);

    // let chapters = "";
    // course?.courseLayout.chapters.forEach((chapter) => {
    //   chapters =
    //     (chapter.chapter_title || chapter.chapterTitle) + "," + chapters;
    // });

    const chapters = course?.courseLayout?.chapters
      ?.map((chapter) => chapter.chapter_title || chapter.chapterTitle)
      .filter(Boolean)
      .join(", ");

    const result = await axios.post("/api/study-type-content", {
      courseId: course?.courseId,
      type: item.name,
      chapters: chapters,
    });
    console.log("API Response:", result.data); // Log API response

    setLoading(false);
    console.log(result);
    refreshData(true);
    toast({
      title: "Success",
      description: "Content generated successfully",
    });
  };

  return (
    <div
      className={`border shadow-md rounded-lg p-5 flex flex-col items-center
      ${studyTypeContent?.[item.type]?.length == 0 && "grayscale"}
    `}
    >
      {/* if nothing in the item in studyTypeContent then show the generate else show ready */}
      {studyTypeContent?.[item.type]?.length == 0 ? (
        <h2 className="p-1 px-2 bg-gray-500 text-white rounded-full text-[10px] mb-2">
          Generate
        </h2>
      ) : (
        <h2 className="p-1 px-2 bg-green-500 text-white rounded-full text-[10px] mb-2">
          Ready
        </h2>
      )}

      {/*icon for each item */}
      <Image src={item.icon} alt={item.name} width={50} height={50} />
      <h2 className="font-medium mt-3">{item.name}</h2>
      <p className="text-gray-500 text-sm text-center">{item.desc}</p>

      {/* {
          "notes": [{ "title": "Chapter 1", "content": "..." }],
          "flashcard": [],
          "quiz": [],
          "qa": []
          }
          "notes" has one entry, meaning notes exist.
          "flashcard", "quiz", and "qa" are empty arrays, meaning they haven't been generated yet.
      */}

      {studyTypeContent?.[item.type]?.length == 0 ? (
        <Button
          className="mt-3 w-full"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            GenerateContent();
          }}
        >
          {loading && <RefreshCcw className="animate-spin" />}
          Generate
        </Button>
      ) : (
        <Link href={"/course/" + course?.courseId + item.path}>
          <Button className="mt-3 w-full" variant="outline">
            View
          </Button>
        </Link>
      )}
    </div>
  );
}

export default MaterialCardItem;
