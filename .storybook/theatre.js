import { getProject } from "@theatre/core";
import studio from "@theatre/studio";
import extension from "@theatre/r3f/dist/extension";
import { SheetProvider } from "@theatre/r3f";
import { useEffect } from "react";

studio.initialize();
studio.extend(extension);

const demoSheet = getProject("twopack.gallery").sheet("storybook");

export default function TheatreSheetDecorator(StoryFn, options) {
  const hideStudio = options.args.noTheatre || options.args.noStage
  useEffect(() => {
    if (hideStudio) {
      studio.ui.hide()
    }
    else {
      studio.ui.restore()
    }
  }, [hideStudio])
  if (hideStudio) {
    return <StoryFn />;
  } else {
    return (
      <SheetProvider sheet={demoSheet}>
        <StoryFn />
      </SheetProvider>
    );
  }
}
