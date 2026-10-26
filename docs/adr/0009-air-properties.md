# 0009. Air properties: ideal gas and Sutherland, Excel roundings kept

- Status: Accepted
- Date: 2026-10-08 (stage 1)
- Source: project decision; PR #5

## Context
`airAtConditions` needs density and viscosity; the aero fixtures come from the Excel.

## Decision
**Air** (`airAtConditions`): ideal gas density, Sutherland viscosity. The constants 273 and 9.8 are the Excel's roundings, kept so the aero fixtures match.

## Consequences
Changing these constants would break the aero fixtures.
