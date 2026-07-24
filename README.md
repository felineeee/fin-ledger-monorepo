
# ER Diagram
```mermaid
erDiagram
    %% Relationships
    locations ||--o{ inventory_levels : "has levels"
    locations ||--o{ inventory_ledger : "logs events"
    locations ||--o{ transfers : "dispatches"
    locations ||--o{ transfers : "receive"
    locations ||--o{ stocktakes : "conducts"
    locations ||--o{ purchase_orders : "receives"

    
    suppliers ||--o{ purchase_orders : "fulfills"
    purchase_orders ||--o{ purchase_order_items : "contains"
    
    transfers ||--o{ transfer_items : "contains"
    
    stocktakes ||--o{ stocktake_items : "contains"

    %% Tables
    locations {
        uuid id PK
        varchar name
        varchar type
        text address
        boolean is_active
        timestamptz created_at
    }

    inventory_levels {
        uuid id PK
        uuid location_id FK
        uuid product_id "Soft Ref"
        uuid variant_id "Soft Ref"
        integer quantity_on_hand
        integer quantity_reserved
        integer reorder_point
        timestamptz updated_at
    }

    inventory_ledger {
        uuid id PK
        uuid location_id FK
        uuid product_id "Soft Ref"
        uuid variant_id "Soft Ref"
        varchar transaction_type
        integer quantity_change
        varchar reference_type
        uuid reference_id "Polymorphic Ref"
        timestamptz created_at
    }

    suppliers {
        uuid id PK
        varchar name
        varchar contact_email
        integer lead_time_days
        boolean is_active
        timestamptz created_at
    }

    purchase_orders {
        uuid id PK
        varchar po_number
        uuid supplier_id FK
        uuid destination_location_id FK
        varchar status
        timestamptz expected_delivery_date
        timestamptz created_at
        timestamptz updated_at
    }

    purchase_order_items {
        uuid id PK
        uuid po_id FK
        uuid product_id "Soft Ref"
        uuid variant_id "Soft Ref"
        integer quantity_ordered
        integer quantity_received
        numeric unit_cost
    }

    transfers {
        uuid id PK
        varchar tracking_number
        uuid source_location_id FK
        uuid destination_location_id FK
        varchar status
        timestamptz dispatched_at
        timestamptz received_at
        timestamptz created_at
    }

    transfer_items {
        uuid id PK
        uuid transfer_id FK
        uuid product_id "Soft Ref"
        uuid variant_id "Soft Ref"
        integer quantity_requested
        integer quantity_dispatched
        integer quantity_received
    }

    stocktakes {
        uuid id PK
        uuid location_id FK
        varchar status
        timestamptz started_at
        timestamptz completed_at
    }

    stocktake_items {
        uuid id PK
        uuid stocktake_id FK
        uuid product_id "Soft Ref"
        uuid variant_id "Soft Ref"
        integer expected_quantity
        integer counted_quantity
        integer variance
    }
```

# Inventory Lifecycle
```mermaid
stateDiagram-v2
    direction LR

    state "Purchase Order Lifecycle" as PO {
        [*] --> DRAFT : Create

        DRAFT --> SENT : Finalize & Send
        DRAFT --> CANCELLED : Cancel

        SENT --> PARTIALLY_RECEIVED : Partial
        SENT --> RECEIVED : Full

        state PARTIALLY_RECEIVED {
            [*] --> InProgress
            InProgress --> InProgress : Additional
        }

        PARTIALLY_RECEIVED --> RECEIVED : Final

        RECEIVED --> [*]
        CANCELLED --> [*]
    }
```
```mermaid
stateDiagram-v2
    direction LR

    state "Inter-Branch Transfers" as Transfer {
        [*] --> PENDING : Submit Request
        
        PENDING --> CANCELLED_TR : Cancel
        PENDING --> IN_TRANSIT : Dispatch (Deducts Origin)
        
        IN_TRANSIT --> COMPLETED : Receive (Increments Dest)
        IN_TRANSIT --> REJECTED : Refuse Shipment
        
        COMPLETED --> [*]
        CANCELLED_TR --> [*]
        REJECTED --> [*]
    }
```
```mermaid
stateDiagram-v2
    direction LR

    state "Stocktake Sessions" as Stocktake {
        [*] --> IN_PROGRESS : Start & Snapshot
        
        IN_PROGRESS --> ABORTED : Delete Session
        IN_PROGRESS --> FINALIZED : Complete (Calculates Variance)
        
        FINALIZED --> [*]
        ABORTED --> [*]
    }
```
```mermaid
stateDiagram-v2
    direction LR

    state "Returns" as Returns {
        [*] --> QUARANTINE : Process Return
        
        QUARANTINE --> RESTOCKED : Move to Sales Floor
        QUARANTINE --> DISCARDED : Write-off (Damage)
        
        RESTOCKED --> [*]
        DISCARDED --> [*]
    }
```
