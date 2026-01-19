"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/analyze-watchlist.ts
var analyze_watchlist_exports = {};
__export(analyze_watchlist_exports, {
  config: () => config,
  default: () => analyze_watchlist_default
});
module.exports = __toCommonJS(analyze_watchlist_exports);
var analyze_watchlist_default = async (req) => {
  try {
    const baseUrl = process.env.URL || "http://localhost:3000";
    console.log(`[Scheduler] Triggering background job at ${baseUrl}/.netlify/functions/analyze-watchlist-background`);
    const response = await fetch(`${baseUrl}/.netlify/functions/analyze-watchlist-background`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log(`[Scheduler] Background job triggered, status: ${response.status}`);
    return new Response(JSON.stringify({
      success: true,
      message: "Background job triggered",
      status: response.status
    }), { status: 200 });
  } catch (error) {
    console.error("[Scheduler] Netlify function error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), { status: 500 });
  }
};
var config = {
  schedule: "0 11 * * *"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvYW5hbHl6ZS13YXRjaGxpc3QudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ29uZmlnIH0gZnJvbSBcIkBuZXRsaWZ5L2Z1bmN0aW9uc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcTogUmVxdWVzdCkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBiYXNlVXJsID0gcHJvY2Vzcy5lbnYuVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnO1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZyhgW1NjaGVkdWxlcl0gVHJpZ2dlcmluZyBiYWNrZ3JvdW5kIGpvYiBhdCAke2Jhc2VVcmx9Ly5uZXRsaWZ5L2Z1bmN0aW9ucy9hbmFseXplLXdhdGNobGlzdC1iYWNrZ3JvdW5kYCk7XHJcblxyXG4gICAgLy8gVHJpZ2dlciBiYWNrZ3JvdW5kIGZ1bmN0aW9uIC0gdGhpcyByZXR1cm5zIDIwMiBpbW1lZGlhdGVseVxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtiYXNlVXJsfS8ubmV0bGlmeS9mdW5jdGlvbnMvYW5hbHl6ZS13YXRjaGxpc3QtYmFja2dyb3VuZGAsIHtcclxuICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhgW1NjaGVkdWxlcl0gQmFja2dyb3VuZCBqb2IgdHJpZ2dlcmVkLCBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xyXG5cclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiAnQmFja2dyb3VuZCBqb2IgdHJpZ2dlcmVkJyxcclxuICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXNcclxuICAgIH0pLCB7IHN0YXR1czogMjAwIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdbU2NoZWR1bGVyXSBOZXRsaWZ5IGZ1bmN0aW9uIGVycm9yOicsIGVycm9yKTtcclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXHJcbiAgICB9KSwgeyBzdGF0dXM6IDUwMCB9KTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgY29uZmlnOiBDb25maWcgPSB7XHJcbiAgc2NoZWR1bGU6IFwiMCAxMSAqICogKlwiXHJcbn07XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBRUEsSUFBTyw0QkFBUSxPQUFPLFFBQWlCO0FBQ3JDLE1BQUk7QUFDRixVQUFNLFVBQVUsUUFBUSxJQUFJLE9BQU87QUFFbkMsWUFBUSxJQUFJLDRDQUE0QyxPQUFPLGtEQUFrRDtBQUdqSCxVQUFNLFdBQVcsTUFBTSxNQUFNLEdBQUcsT0FBTyxvREFBb0Q7QUFBQSxNQUN6RixRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsUUFDUCxnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0YsQ0FBQztBQUVELFlBQVEsSUFBSSxpREFBaUQsU0FBUyxNQUFNLEVBQUU7QUFFOUUsV0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVO0FBQUEsTUFDakMsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLE1BQ1QsUUFBUSxTQUFTO0FBQUEsSUFDbkIsQ0FBQyxHQUFHLEVBQUUsUUFBUSxJQUFJLENBQUM7QUFBQSxFQUNyQixTQUFTLE9BQU87QUFDZCxZQUFRLE1BQU0sdUNBQXVDLEtBQUs7QUFDMUQsV0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVO0FBQUEsTUFDakMsU0FBUztBQUFBLE1BQ1QsT0FBTyxpQkFBaUIsUUFBUSxNQUFNLFVBQVU7QUFBQSxJQUNsRCxDQUFDLEdBQUcsRUFBRSxRQUFRLElBQUksQ0FBQztBQUFBLEVBQ3JCO0FBQ0Y7QUFFTyxJQUFNLFNBQWlCO0FBQUEsRUFDNUIsVUFBVTtBQUNaOyIsCiAgIm5hbWVzIjogW10KfQo=
