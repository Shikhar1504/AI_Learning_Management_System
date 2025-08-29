function ChapterList({ course }) {
  const CHAPTERS = course?.courseLayout?.chapters;
  return (
    <div className="mt-5">
      <h2 className="font-semibold text-xl">Chapters</h2>

      <div className="mt-3">
        {CHAPTERS?.map((chapter, index) => (
          <div
            key={index}
            className="flex gap-4 items-center p-4 border rounded-xl bg-card hover:bg-accent/10 transition"
          >
            <h2 className="text-2xl">{chapter?.emoji}</h2>
            <div>
              <h2 className="font-medium">
                {chapter?.chapter_title || chapter?.chapterTitle}
              </h2>
              <p className="text-muted-foreground text-sm">
                {chapter?.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChapterList;
