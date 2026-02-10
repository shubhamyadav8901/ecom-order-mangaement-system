package com.ecommerce.common.event;

import java.util.Map;

public final class EventContractVersions {

    public static final String HEADER_NAME = "event-contract-version";
    public static final String DEFAULT_VERSION = "v1";

    private static final Map<String, String> TOPIC_VERSIONS = Map.ofEntries(
            Map.entry("order-created", "v1"),
            Map.entry("order-cancelled", "v1"),
            Map.entry("inventory-reserved", "v1"),
            Map.entry("inventory-failed", "v1"),
            Map.entry("payment-success", "v1"),
            Map.entry("payment-failed", "v1"),
            Map.entry("refund-requested", "v1"),
            Map.entry("refund-success", "v1"),
            Map.entry("refund-failed", "v1"));

    private EventContractVersions() {
    }

    public static String versionForTopic(String topic) {
        return TOPIC_VERSIONS.getOrDefault(topic, DEFAULT_VERSION);
    }
}
