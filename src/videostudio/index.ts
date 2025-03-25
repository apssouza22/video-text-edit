import { setupControls } from "./controls";
import { setupTimeline } from "./timeline";

import { composition } from "./VideoStudioUtils";

// connect to ui
setupControls(composition);
setupTimeline(composition);
