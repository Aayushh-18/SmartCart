package com.smartcart;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@WebServlet("/feedback")
public class FeedbackServlet extends HttpServlet {

    private static final String MONGO_URI = "mongodb+srv://SmartCart:aayush182005@cluster0.n7rlxnr.mongodb.net/smartcart?retryWrites=true&w=majority&appName=Cluster0";
    private MongoClient mongoClient;
    private MongoCollection<Document> collection;

    @Override
    public void init() throws ServletException {
        mongoClient = MongoClients.create(MONGO_URI);
        MongoDatabase database = mongoClient.getDatabase("smartcart");
        collection = database.getCollection("feedbacks");
    }

    // Handle GET — return all feedbacks
    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");

        PrintWriter out = response.getWriter();

        StringBuilder sb = new StringBuilder("[");
        boolean first = true;

        for (Document doc : collection.find()) {
            if (!first) sb.append(",");
            sb.append("{");
            sb.append("\"name\":\"").append(doc.getString("name")).append("\",");
            sb.append("\"email\":\"").append(doc.getString("email")).append("\",");
            sb.append("\"rating\":").append(doc.getInteger("rating")).append(",");
            sb.append("\"message\":\"").append(doc.getString("message")).append("\",");
            sb.append("\"submittedAt\":\"").append(doc.getString("submittedAt")).append("\"");
            sb.append("}");
            first = false;
        }

        sb.append("]");
        out.print(sb.toString());
        out.flush();
    }

    // Handle POST — save new feedback
    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");

        String name    = request.getParameter("name");
        String email   = request.getParameter("email");
        String rating  = request.getParameter("rating");
        String message = request.getParameter("message");

        // Validate
        if (name == null || email == null ||
            rating == null || message == null ||
            name.isEmpty() || email.isEmpty() ||
            rating.isEmpty() || message.isEmpty()) {

            response.setStatus(400);
            response.getWriter().print(
                "{\"success\":false,\"message\":\"All fields are required\"}"
            );
            return;
        }

        // Save to MongoDB
        Document feedback = new Document()
            .append("name", name)
            .append("email", email)
            .append("rating", Integer.parseInt(rating))
            .append("message", message)
            .append("submittedAt",
                LocalDateTime.now().format(
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                )
            );

        collection.insertOne(feedback);

        response.setStatus(201);
        response.getWriter().print(
            "{\"success\":true,\"message\":\"Feedback submitted successfully\"}"
        );
    }

    // Handle OPTIONS for CORS preflight
    @Override
    protected void doOptions(HttpServletRequest request,
                             HttpServletResponse response)
            throws ServletException, IOException {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setStatus(200);
    }

    @Override
    public void destroy() {
        if (mongoClient != null) {
            mongoClient.close();
        }
    }
}