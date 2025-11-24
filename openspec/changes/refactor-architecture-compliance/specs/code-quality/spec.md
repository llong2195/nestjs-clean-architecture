## ADDED Requirements

### Requirement: Zero Circular Dependencies

The system SHALL maintain zero circular dependencies in the codebase to ensure modularity, testability, and maintainability.

#### Scenario: Detect circular dependencies with madge

- **GIVEN** the codebase is complete
- **WHEN** running `pnpm circular` (madge --circular --extensions ts src/)
- **THEN** the output SHALL report "No circular dependency found!"
- **AND** the command SHALL exit with code 0

#### Scenario: Prevent new circular dependencies in CI

- **GIVEN** a pull request with code changes
- **WHEN** CI pipeline runs quality checks
- **THEN** circular dependency detection SHALL run automatically
- **AND** the build SHALL fail if any circular dependencies are detected

### Requirement: ORM Entity Independence

TypeORM entities SHALL NOT have bidirectional object references that create circular imports between entity files.

#### Scenario: Message entity references conversation by ID

- **GIVEN** a MessageOrmEntity class
- **WHEN** defining the relationship to ConversationOrmEntity
- **THEN** the message SHALL store conversationId as a string column
- **AND** the message SHALL NOT import ConversationOrmEntity type
- **AND** queries SHALL explicitly join messages to conversations when needed

#### Scenario: Comment entity references post by ID

- **GIVEN** a CommentOrmEntity class
- **WHEN** defining the relationship to PostOrmEntity
- **THEN** the comment SHALL store postId as a string column
- **AND** the comment SHALL NOT import PostOrmEntity type
- **AND** queries SHALL explicitly join comments to posts when needed

#### Scenario: Repository loads related entities explicitly

- **GIVEN** a repository needs to load an aggregate with child entities
- **WHEN** fetching data from the database
- **THEN** the repository SHALL use explicit joins or separate queries
- **AND** the repository SHALL NOT rely on TypeORM navigation properties for relationships that would cause circular imports

### Requirement: Dedicated ORM Mappers

All repositories SHALL use dedicated mapper classes to translate between ORM entities and domain entities, following the hexagonal architecture pattern.

#### Scenario: UserRepository uses UserOrmMapper

- **GIVEN** a UserRepository implementation
- **WHEN** saving or loading user entities
- **THEN** the repository SHALL inject a UserOrmMapper dependency
- **AND** the repository SHALL delegate all ORM↔Domain conversion to the mapper
- **AND** the repository SHALL NOT contain inline mapping logic

#### Scenario: Mapper is testable in isolation

- **GIVEN** a UserOrmMapper class
- **WHEN** writing unit tests
- **THEN** the mapper SHALL be testable without database connection
- **AND** tests SHALL verify bidirectional conversion (toOrm and toDomain)
- **AND** tests SHALL verify all fields map correctly

#### Scenario: Mapper location follows convention

- **GIVEN** a new mapper class is needed
- **WHEN** creating the mapper file
- **THEN** the file SHALL be located in `src/modules/{module}/infrastructure/mappers/`
- **AND** the filename SHALL follow pattern `{entity}-orm.mapper.ts`
- **AND** the class name SHALL follow pattern `{Entity}OrmMapper`

### Requirement: Consistent Module Structure

All feature modules SHALL follow the documented 4-layer architecture structure consistently.

#### Scenario: New module follows template structure

- **GIVEN** a new feature module is created
- **WHEN** scaffolding the directory structure
- **THEN** the module SHALL have domain/, application/, infrastructure/, and interface/ directories
- **AND** infrastructure/ SHALL have persistence/, cache/, and mappers/ subdirectories
- **AND** all mapper classes SHALL reside in infrastructure/mappers/

## MODIFIED Requirements

None - This is a new capability focused on eliminating circular dependencies and enforcing mapper pattern consistency.

## REMOVED Requirements

None - All requirements are additions to improve code quality standards.
