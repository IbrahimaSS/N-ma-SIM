package com.orangeguinee.opsmock;

import java.util.LinkedList;

/** Meme format de reponse que LogAction du projet OPS. */
public class LogAction {
    private String status = "0";
    private String message;
    private LinkedList<String> responses;
    private LinkedList<Object> conso;

    public LogAction() { }

    public LogAction(String status, String message, LinkedList<String> responses) {
        this.status = status;
        this.message = message;
        this.responses = responses;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LinkedList<String> getResponses() { return responses; }
    public void setResponses(LinkedList<String> responses) { this.responses = responses; }
    public LinkedList<Object> getConso() { return conso; }
    public void setConso(LinkedList<Object> conso) { this.conso = conso; }
}
