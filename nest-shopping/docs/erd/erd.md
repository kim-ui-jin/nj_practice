```mermaid
erDiagram
  USERS ||--o{ PRODUCTS : creates
  USERS ||--o{ ORDERS : places
  USERS ||--o{ CART : has
  USERS ||--o{ USER_AUTHORITY : has

  PRODUCTS ||--o{ ORDER_ITEMS : included_in
  PRODUCTS ||--o{ CART : in
  PRODUCTS ||--o{ PRODUCT_TAGS : tagged_with

  ORDERS ||--o{ ORDER_ITEMS : contains

  TAGS ||--o{ PRODUCT_TAGS : used_by

  USERS {
    INT seq PK
    VARCHAR userId UK
    VARCHAR userName
    VARCHAR userPhone
    VARCHAR userEmail UK
    VARCHAR userAddress
    CHAR userPassword
    CHAR refreshTokenHash
    ENUM status
    DATETIME deletedAt
  }

  PRODUCTS {
    INT seq PK
    VARCHAR name
    INT price
    INT stockQuantity
    VARCHAR description
    VARCHAR thumbnailUrl
    JSON imageUrls
    INT created_by_user_seq FK
    TIMESTAMP createdAt
    TIMESTAMP updatedAt
    ENUM status
  }

  ORDERS {
    INT seq PK
    CHAR orderNumber UK
    INT itemsTotal
    INT shippingFee
    INT orderTotal
    VARCHAR receiverName
    VARCHAR receiverPhone
    CHAR zipCode
    VARCHAR address1
    VARCHAR address2
    VARCHAR memo
    INT user_seq FK
    TIMESTAMP createdAt
    CHAR status
    VARCHAR pgProvider
    VARCHAR paymentKey
    TIMESTAMP paidAt
  }

  ORDER_ITEMS {
    INT seq PK
    VARCHAR productName
    INT unitPrice
    INT quantity
    INT lineTotal
    INT order_seq FK
    INT product_seq FK
  }

  CART {
    INT seq PK
    INT quantity
    INT user_seq FK
    INT product_seq FK
  }

  TAGS {
    INT seq PK
    VARCHAR tagName UK
  }

  PRODUCT_TAGS {
    INT product_seq PK_FK
    INT tag_seq PK_FK
  }

  USER_AUTHORITY {
    INT seq PK
    VARCHAR authorityName
    INT user_seq FK
  }
