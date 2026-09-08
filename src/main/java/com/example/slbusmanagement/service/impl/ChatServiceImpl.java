package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.service.ChatService;
import com.example.slbusmanagement.service.ReportService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;


@Service
@Slf4j
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ReportService reportService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Override
    public String ask(String question) {
        String hardcoded = tryHardcodedAnswer(question);
        if (hardcoded != null) {
            log.info("Chat question answered by hardcoded rule (no AI call): {}", question);
            return hardcoded;
        }

        if (apiKey == null || apiKey.isBlank() || apiKey.equals("PASTE_YOUR_GEMINI_API_KEY_HERE")) {
            throw new CustomException(ResponseCode.INTERNAL_SERVER_ERROR,
                    "The chatbot isn't configured yet — add a free Gemini API key to application.properties (gemini.api.key). Get one at https://aistudio.google.com/apikey");
        }

        String context = buildBusinessContext();
        String prompt = """
                You are the internal business assistant for "SL Travel Buddy", a bus fleet
                management company. Answer the Owner/Manager's question using ONLY the data
                below — never invent numbers. If the data doesn't cover the question, say so
                plainly instead of guessing. Keep answers concise and business-focused.
                
                === CURRENT BUSINESS DATA ===
                %s
                
                === QUESTION ===
                %s
                """.formatted(context, question);

        try {
            Map<String, Object> body = Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{Map.of("text", prompt)})
                    }
            );
            String requestJson = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error {}: {}", response.statusCode(), response.body());
                if (response.statusCode() == 404) {

                    throw new CustomException(ResponseCode.INTERNAL_SERVER_ERROR,
                            "The AI assistant's configured model is no longer available. Update gemini.api.url in application.properties to a current model name (see https://ai.google.dev/gemini-api/docs/models).");
                }
                throw new CustomException(ResponseCode.INTERNAL_SERVER_ERROR, "The AI assistant is temporarily unavailable. Please try again shortly.");
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode()) {
                log.error("Unexpected Gemini response shape: {}", response.body());
                throw new CustomException(ResponseCode.INTERNAL_SERVER_ERROR, "The AI assistant returned an unexpected response. Please try again.");
            }
            return textNode.asText();

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Chat request failed", e);
            throw new CustomException(ResponseCode.INTERNAL_SERVER_ERROR, "Could not reach the AI assistant right now.");
        }
    }


    private String tryHardcodedAnswer(String rawQuestion) {
        String q = " " + rawQuestion.toLowerCase().trim() + " ";

        boolean lastMonth = containsAny(q, "last month", "previous month", "prior month", "past month");
        boolean thisMonth = containsAny(q, "this month", "current month", "month so far", "so far this month");
        boolean today = containsAny(q, "today", "so far today");
        boolean thisWeek = containsAny(q, "this week", "past week", "last 7 days", "last week");

        boolean profit = containsAny(q, "profit", "net income", "how much did we make", "how much have we made", "how much money did we make", "margin");
        boolean income = containsAny(q, "income", "revenue", "earnings", "how much did we earn");
        boolean expense = containsAny(q, "expense", "expenses", "spending", "cost", "costs", "how much did we spend");
        boolean tripCount = containsAny(q, "how many trips", "number of trips", "trip count", "trips did we run", "trips ran");

        boolean topRoutes = containsAny(q, "top route", "best route", "busiest route", "most popular route", "most used route");
        boolean topDrivers = containsAny(q, "top driver", "best driver", "busiest driver");
        boolean topConductors = containsAny(q, "top conductor", "best conductor", "busiest conductor");

        boolean alerts = containsAny(q, "alert", "urgent", "needs attention", "need attention", "what should i worry about", "anything wrong", "any issues");
        boolean serviceDue = containsAny(q, "needs service", "need service", "needs maintenance", "need maintenance", "due for service", "overdue service", "which bus needs");

        boolean helpMe = containsAny(q, "what can you", "what can i ask", "help me", "what do you know", "what questions") && q.trim().length() < 60;

        // top routes this month
        if (topRoutes)
            return formatTopList("route", reportService.topRoutes(monthRangeFor(lastMonth)[0], monthRangeFor(lastMonth)[1], 5), lastMonth);
        if (topDrivers)
            return formatTopList("driver", reportService.topDrivers(monthRangeFor(lastMonth)[0], monthRangeFor(lastMonth)[1], 5), lastMonth);
        if (topConductors)
            return formatTopList("conductor", reportService.topConductors(monthRangeFor(lastMonth)[0], monthRangeFor(lastMonth)[1], 5), lastMonth);

        //Alerts / maintenance
        if (alerts) return formatAlerts(reportService.fleetAlerts(), "fleet/document alerts");
        if (serviceDue) return formatAlerts(reportService.serviceReminders(), "service reminders");

        //Trip counts
        if (tripCount && (lastMonth || thisMonth || today || thisWeek)) {
            LocalDate[] range = today ? new LocalDate[]{LocalDate.now(), LocalDate.now()}
                    : thisWeek ? new LocalDate[]{LocalDate.now().minusDays(6), LocalDate.now()}
                      : monthRangeFor(lastMonth);
            Map<String, Object> s = reportService.summaryStats(range[0], range[1]);
            String period = today ? "today" : thisWeek ? "in the last 7 days" : monthLabel(lastMonth);
            return "You ran " + s.get("totalTrips") + " trip(s) " + period + ".";
        }

        //Profit / income / expenses for a specific period
        if ((profit || income || expense) && (lastMonth || thisMonth)) {
            Map<String, Object> s = reportService.summaryStats(monthRangeFor(lastMonth)[0], monthRangeFor(lastMonth)[1]);
            String period = monthLabel(lastMonth);
            StringBuilder sb = new StringBuilder();
            if (profit)
                sb.append("Net profit ").append(period).append(" was ").append(money(s.get("netProfit"))).append(". ");
            if (income)
                sb.append("Total income ").append(period).append(" was ").append(money(s.get("totalIncome"))).append(". ");
            if (expense)
                sb.append("Total expenses ").append(period).append(" were ").append(money(s.get("totalExpenses"))).append(". ");
            if (profit || (!income && !expense)) {
                sb.append("(Income: ").append(money(s.get("totalIncome"))).append(", Expenses: ").append(money(s.get("totalExpenses"))).append(")");
            }
            return sb.toString().trim();
        }


        if (profit || income || expense) {
            LocalDate[] range = monthRangeFor(false);
            Map<String, Object> s = reportService.summaryStats(range[0], range[1]);
            StringBuilder sb = new StringBuilder("This month so far: ");
            sb.append("income ").append(money(s.get("totalIncome"))).append(", ");
            sb.append("expenses ").append(money(s.get("totalExpenses"))).append(", ");
            sb.append("net profit ").append(money(s.get("netProfit"))).append(".");
            return sb.toString();
        }

        if (helpMe) {
            return "You can ask me things like: \"What was last month's profit?\", "
                    + "\"How much income did we make this month?\", \"What are the top routes this month?\", "
                    + "\"Which bus needs maintenance?\", \"Any urgent alerts?\", or \"How many trips did we run this week?\" "
                    + "For anything else, just ask in plain language — I'll do my best using today's live data.";
        }

        return null;
    }

    private boolean containsAny(String haystack, String... needles) {
        for (String n : needles) if (haystack.contains(n)) return true;
        return false;
    }

    private LocalDate[] monthRangeFor(boolean lastMonth) {
        LocalDate today = LocalDate.now();
        if (lastMonth) {
            LocalDate prevMonth = today.minusMonths(1);
            return new LocalDate[]{prevMonth.withDayOfMonth(1), prevMonth.withDayOfMonth(prevMonth.lengthOfMonth())};
        }
        return new LocalDate[]{today.withDayOfMonth(1), today};
    }

    private String monthLabel(boolean lastMonth) {
        LocalDate d = lastMonth ? LocalDate.now().minusMonths(1) : LocalDate.now();
        String name = d.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + d.getYear();
        return lastMonth ? "in " + name : "so far this month (" + name + ")";
    }

    private String money(Object value) {
        double v = value instanceof Number n ? n.doubleValue() : 0.0;
        return String.format(Locale.ENGLISH, "Rs. %,.2f", v);
    }

    private String formatTopList(String label, List<Map<String, Object>> rows, boolean lastMonth) {
        if (rows == null || rows.isEmpty()) return "No " + label + " data " + monthLabel(lastMonth) + " yet.";
        StringBuilder sb = new StringBuilder("Top " + label + "s " + monthLabel(lastMonth) + ":\n");
        int rank = 1;
        for (Map<String, Object> r : rows) {
            sb.append(rank++).append(". ");

            Object name = r.containsKey("route") ? r.get("route") : r.get("name");
            Object count = r.containsKey("occurrences") ? r.get("occurrences") : r.get("trips");
            sb.append(name);
            if (count != null) sb.append(" — ").append(count).append(" trip(s)");
            if (r.containsKey("income")) sb.append(", ").append(money(r.get("income")));
            sb.append("\n");
        }
        return sb.toString().trim();
    }

    private String formatAlerts(List<Map<String, Object>> alerts, String label) {
        if (alerts == null || alerts.isEmpty()) return "No " + label + " right now — everything looks good.";
        StringBuilder sb = new StringBuilder("You have " + alerts.size() + " " + label + ":\n");
        for (Map<String, Object> a : alerts) {
            sb.append("- ").append(a.get("text")).append("\n");
        }
        return sb.toString().trim();
    }


    private String buildBusinessContext() {
        StringBuilder sb = new StringBuilder();
        LocalDate today = LocalDate.now();
        LocalDate[] thisMonthRange = monthRangeFor(false);
        LocalDate[] lastMonthRange = monthRangeFor(true);

        Map<String, Object> thisMonthStats = reportService.summaryStats(thisMonthRange[0], thisMonthRange[1]);
        Map<String, Object> lastMonthStats = reportService.summaryStats(lastMonthRange[0], lastMonthRange[1]);

        sb.append("THIS MONTH (" + monthLabel(false) + "): income ").append(money(thisMonthStats.get("totalIncome")))
                .append(", expenses ").append(money(thisMonthStats.get("totalExpenses")))
                .append(", net profit ").append(money(thisMonthStats.get("netProfit")))
                .append(", trips ").append(thisMonthStats.get("totalTrips")).append("\n\n");

        sb.append("LAST MONTH (" + monthLabel(true) + "): income ").append(money(lastMonthStats.get("totalIncome")))
                .append(", expenses ").append(money(lastMonthStats.get("totalExpenses")))
                .append(", net profit ").append(money(lastMonthStats.get("netProfit")))
                .append(", trips ").append(lastMonthStats.get("totalTrips")).append("\n\n");

        var alerts = reportService.fleetAlerts();
        sb.append("Active fleet/document alerts (").append(alerts.size()).append("): ").append(alerts).append("\n\n");

        var serviceReminders = reportService.serviceReminders();
        sb.append("Service reminders (").append(serviceReminders.size()).append("): ").append(serviceReminders).append("\n\n");

        var topRoutes = reportService.topRoutes(thisMonthRange[0], thisMonthRange[1], 5);
        sb.append("Top routes this month: ").append(topRoutes).append("\n\n");

        var topDrivers = reportService.topDrivers(thisMonthRange[0], thisMonthRange[1], 5);
        sb.append("Top drivers this month: ").append(topDrivers).append("\n\n");

        var recentTrips = reportService.tripReport(today.minusDays(7), today);
        sb.append("Trips in the last 7 days (").append(recentTrips.size()).append("): ").append(recentTrips);

        return sb.toString();
    }
}
