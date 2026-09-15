(function () {
    const LOG_PREFIX = "[SLCM Attendance Highlighter]";
    const ABSENT_BG = "#e74c3c";
    const ABSENT_BORDER = "#c0392b";

    let processedEvents = new Set();
    let isProcessing = false;

    function getEventId(e) {
        return e.EntryNo || e.id || e.Id || e.EventID || e.eventID;
    }

    function processEvents(events) {
        if (isProcessing) return;
        isProcessing = true;

        console.log(LOG_PREFIX, "Total events received:", events.length);

        const eventsToProcess = events.filter((e) => {
            const evtId = getEventId(e);
            return evtId != null && !processedEvents.has(evtId);
        });

        console.log(LOG_PREFIX, "Events to check this pass:", eventsToProcess.length);

        let loadingIndicator = window.jQuery('#slcm-loading-indicator');
        if (eventsToProcess.length > 0) {
            if (!loadingIndicator.length) {
                loadingIndicator = window.jQuery('<div id="slcm-loading-indicator" style="position: fixed; bottom: 20px; right: 20px; background: #34495e; color: white; padding: 10px 15px; border-radius: 5px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-family: sans-serif; font-size: 14px; transition: opacity 0.3s;"></div>');
                window.jQuery('body').append(loadingIndicator);
            }
            loadingIndicator.text(`Syncing Attendance... (0/${eventsToProcess.length})`).css({ opacity: '1', background: '#34495e' });
        }

        let index = 0;
        let needsRerender = false;

        function next() {
            if (index >= eventsToProcess.length) {
                if (needsRerender && typeof window.jQuery !== "undefined" &&
                    typeof window.jQuery("#calendar").fullCalendar === "function") {
                    window.jQuery("#calendar").fullCalendar("rerenderEvents");
                    console.log(LOG_PREFIX, "Rerendered calendar");
                }

                if (eventsToProcess.length > 0 && loadingIndicator.length) {
                    loadingIndicator.text('Attendance Synced!').css('background', '#27ae60');
                    setTimeout(() => loadingIndicator.css('opacity', '0'), 2000);
                }

                isProcessing = false;
                return;
            }

            if (loadingIndicator.length) {
                loadingIndicator.text(`Syncing Attendance... (${index}/${eventsToProcess.length})`);
            }

            const evt = eventsToProcess[index];
            const evtId = getEventId(evt);
            index++;
            processedEvents.add(evtId);



            window.jQuery.ajax({
                type: "POST",
                url: "/Student/Academic/GetEventDetailStudent",
                dataType: "json",
                data: { EventID: evtId },
                success: function (response) {
                    console.log(LOG_PREFIX, "Response for", evtId, response); // TEST: Log response

                    const attendanceType =
                        (response && response.AttendanceType) ||
                        (response && response.data && response.data.AttendanceType) ||
                        (response && response.Result && response.Result.AttendanceType);

                    if (attendanceType && attendanceType.trim() === "Absent") {
                        if (typeof $("#calendar").fullCalendar === "function") {
                            const clientEvents = $("#calendar").fullCalendar("clientEvents", evtId);
                            if (clientEvents && clientEvents.length > 0) {
                                clientEvents[0].backgroundColor = ABSENT_BG;
                                clientEvents[0].borderColor = ABSENT_BORDER;
                                // Remove the 🔴 ABSENT text if it was added previously just in case
                                clientEvents[0].title = clientEvents[0].title.replace("🔴 ABSENT\n", "");
                                needsRerender = true;
                            }
                        }
                    }
                },
                complete: function () {
                    setTimeout(next, 10);
                },
            });
        }
        next();
    }

    function hookAjax() {
        if (typeof window.jQuery === "undefined") {
            console.warn(LOG_PREFIX, "jQuery not found yet, retrying...");
            setTimeout(hookAjax, 500);
            return;
        }

        window.jQuery(document).ajaxSuccess(function (event, xhr, settings) {
            if (settings.url && settings.url.includes("GetStudentCalenderEventList")) {
                try {
                    const events = JSON.parse(xhr.responseText);
                    processEvents(events);
                } catch (e) {
                    console.error(LOG_PREFIX, "Error parsing events", e);
                }
            }
        });

        console.log(LOG_PREFIX, "Hooked into ajaxSuccess, waiting for calendar load...");

        setTimeout(() => {
            const $ = window.jQuery;
            if ($("#calendar").length && typeof $("#calendar").fullCalendar === "function") {
                const clientEvents = $("#calendar").fullCalendar("clientEvents");
                if (clientEvents && clientEvents.length > 0) {
                    console.log(LOG_PREFIX, "Found pre-loaded events, processing...");
                    processEvents(clientEvents);
                }
            }
        }, 1500);
    }

    hookAjax();
})();