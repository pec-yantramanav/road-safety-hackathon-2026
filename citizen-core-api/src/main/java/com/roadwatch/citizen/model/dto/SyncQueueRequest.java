package com.roadwatch.citizen.model.dto;

import java.util.List;
import java.util.Map;

public class SyncQueueRequest {
    private List<SyncAction> actions;

    public List<SyncAction> getActions() { return actions; }
    public void setActions(List<SyncAction> actions) { this.actions = actions; }

    public static class SyncAction {
        private String type; // "CREATE_TICKET", "CONTRIBUTE"
        private Map<String, Object> payload;
        private String clientTimestamp;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public Map<String, Object> getPayload() { return payload; }
        public void setPayload(Map<String, Object> payload) { this.payload = payload; }

        public String getClientTimestamp() { return clientTimestamp; }
        public void setClientTimestamp(String clientTimestamp) { this.clientTimestamp = clientTimestamp; }
    }
}
