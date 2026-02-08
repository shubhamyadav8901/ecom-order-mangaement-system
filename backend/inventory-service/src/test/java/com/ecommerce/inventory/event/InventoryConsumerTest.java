package com.ecommerce.inventory.event;

import com.ecommerce.inventory.service.EventDeduplicationService;
import com.ecommerce.inventory.service.InventoryService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryConsumerTest {

    @Mock
    private InventoryService inventoryService;

    @Mock
    private InventoryProducer inventoryProducer;

    @Mock
    private EventDeduplicationService eventDeduplicationService;

    @InjectMocks
    private InventoryConsumer inventoryConsumer;

    @Test
    void handleCompensation_orderCancelled_releasesReservation() {
        ConsumerRecord<String, Object> record =
                new ConsumerRecord<>("order-cancelled", 0, 0L, "42", new OrderCancelledEvent(42L));
        when(eventDeduplicationService.tryStartProcessing("order-cancelled:42")).thenReturn(true);

        inventoryConsumer.handleCompensation(record);

        verify(inventoryService).releaseReservation(42L);
    }

    @Test
    void handleCompensation_duplicateEvent_skipsRelease() {
        ConsumerRecord<String, Object> record =
                new ConsumerRecord<>("order-cancelled", 0, 0L, "42", new OrderCancelledEvent(42L));
        when(eventDeduplicationService.tryStartProcessing("order-cancelled:42")).thenReturn(false);

        inventoryConsumer.handleCompensation(record);

        verify(inventoryService, never()).releaseReservation(42L);
    }

    @Test
    void handleCompensation_invalidKeyAndPayload_skipsRelease() {
        ConsumerRecord<String, Object> record =
                new ConsumerRecord<>("order-cancelled", 0, 0L, "invalid", new Object());

        inventoryConsumer.handleCompensation(record);

        verify(eventDeduplicationService, never()).tryStartProcessing(org.mockito.ArgumentMatchers.anyString());
        verify(inventoryService, never()).releaseReservation(org.mockito.ArgumentMatchers.anyLong());
    }
}
