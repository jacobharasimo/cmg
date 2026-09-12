# 02 — The data model

What the entities behind the API are, once readings live in a datastore rather
than a text file. The case for that move is [01](01-from-file-to-api.md); the
endpoints that expose these shapes are [03](03-api-contract.md).

## The entities

Five, and the relationships between them are the schema a log file cannot
express:

| Entity | Holds | Why it is its own thing |
| --- | --- | --- |
| **Batch** | a test run: when it started, the environment it ran in | the unit a verdict is scoped to, and the unit that is cached |
| **Device** | a sensor: id, type, quantity, unit, firmware, calibration date | the thing that has a history; today it exists only as a line in one file |
| **Reading** | one timestamped value, belonging to one device | cannot exist without its device, which is exactly what referential integrity is for |
| **Reference** | the controlled value a quantity was held at | per batch today, and eventually per device — see [07](07-scale.md) |
| **ThresholdSet** | the numbers a batch was judged against | makes "judged under which rules" answerable, which today it is not |

Three things follow that the file cannot do:

- **Sensor type becomes a real column** with a constrained set of values, rather
  than a bare string in a log line. `isSensorType()` exists in the client purely
  because that constraint has nowhere to live today.
- **A reading cannot orphan itself.** The parser currently drops readings that
  appear before any device header, because nothing stops a file from having
  them.
- **A device outlives the batch.** `temp-1` becomes an entity with a history
  instead of a name that happens to recur in unrelated files.

## Units become data, and then a preference

Today a unit is a display string hard-coded on the strategy — `'°'`, `'%'`,
`' ppm'`, `' dB'` — concatenated at five call sites. It records how to *print* a
number and nothing about what the number is, so nothing can convert it.

**Every value crosses the wire in one canonical unit, and that unit is the one
the rules are written in.** Here that is Fahrenheit: the spec states its
thresholds in degrees against a 70.0 reference, and the sample data is
Fahrenheit throughout. Choosing Celsius because it is SI would put a conversion
on the *default* path — the one the audit depends on — and buy nothing.

So a device declares its quantity and the unit it is stored in, and readings are
bare numbers in that unit:

```json
{
  "name": "temp-1",
  "quantity": "temperature",
  "unit": "F",
  "stats": { "mean": 70.2, "sd": 5.4 }
}
```

A device that reports Celsius is normalised **at ingestion**, and the unit it
reported is device metadata — recorded once, not repeated on every reading.
Nothing downstream has to know it happened.

**Conversion belongs to the quantity, not the sensor type.** Two sensor types
measuring temperature share one converter; two measuring humidity share the
absence of one. A `quantity → converter` map is the whole mechanism, and it is
why adding a sensor type never means writing conversion code — see
[07](07-scale.md).

Quantities fall into three classes, and the class is what the map stores:

| Class | Quantities | Behaviour |
| --- | --- | --- |
| **Affine** — scale and offset | temperature (°F ↔ °C) | 70 °F is 21.1 °C, but a *difference* of 1 °C is 1.8 °F. Absolutes and differences convert by different rules. |
| **Scale-only** | illuminance (lux ↔ foot-candle), and most future types: pressure, distance, flow, wind speed | 500 lx is 46.5 fc. One factor, and differences convert exactly like absolutes. |
| **None** | relative humidity (%), CO (ppm), noise (dB) | dimensionless ratios and a logarithm. There is no other unit to offer. |

Only the affine class carries the trap below, which is worth knowing because it
is the smallest class and the easiest to over-generalise from.

Once the quantity is declared, offering the reader a metric view is a small
step, and the console already has a display preference to sit beside: the
12/24-hour clock switch in `DeviceDetailPanel`. What follows is what makes it
more than reformatting numbers.

**The sliders convert on the way out, and back on the way in.** "Within 0.5
degrees" is 0.5 °F or 0.5 °C, and those are different tolerances. A reader in
metric drags a slider showing °C, so the number they see is converted for
display — and has to be converted back to °F before it is applied, or the rule
quietly changes. Whatever the screen says, the threshold that crosses the wire
is canonical.

**Differences convert differently from absolutes.** A mean is an absolute
temperature, so °F → °C is `(f − 32) × 5/9`. But σ, the deviation from
reference and the tolerance are all *differences*, and a difference converts by
the scale factor alone: 1 °C is 1.8 °F, not 33.8. Applying the offset to σ is
the bug this section exists to prevent, and it would look plausible on screen.

**The verdict cannot move, and the canonical unit is what guarantees it.**
Evaluation happens in °F on the server, always; conversion is presentation and
nothing else. That is the whole reason the wire unit is fixed rather than
negotiated — otherwise a device sitting exactly on a threshold could flip on
rounding introduced by a conversion, and the audit trail would disagree with
itself depending on who was looking.

**A single "imperial vs metric" toggle would lie.** Of the four registered
types, only the thermometer converts — humidity, CO and noise have no second
unit — so a global switch promises three changes it cannot deliver. But it is
not "temperature only" either: `lux` is already in the sample batch as the
unregistered type, and the moment it gains a strategy there are two convertible
quantities with different conversion classes.

So the control is per quantity, driven by the map, and shows only the quantities
present in the batch that have somewhere to go. With today's data that renders
as one temperature switch; with a lux strategy it renders as two, without any
code changing.

**`ppm` is not a unit that converts, and should not be offered as one.** CO in
mg/m³ is a real figure some regions prefer, but `mg/m³ = ppm × M / 24.45` holds
only at 25 °C and one atmosphere — it depends on molar mass and on the
conditions the reading was taken in. That makes it a derived quantity the server
computes from data it has, not a display toggle the client can apply. Putting it
in the conversion map would produce numbers that look authoritative and are
wrong the moment the room is not at 25 °C.

**The conversion belongs in the client, and the API should have no `units`
parameter.** Not because the arithmetic is cheaper there — a multiply and an add
are noise on either side — but because accepting the unit as a request
parameter costs three things the arithmetic does not:

- **It fragments the cache.** `?units=metric` joins the cache key, so every
  batch is stored and revalidated twice over a multiplication. That undoes
  [04](04-pagination-and-caching.md), where a completed batch is one immutable
  response shared by every reader.
- **It makes the toggle laggy.** A preference someone flicks back and forth
  becomes a round-trip and a loading state, whereas client-side it is a re-render.
- **It invites the verdict bug.** Once an endpoint accepts a unit, something
  eventually evaluates in the requested unit — and two readers then see
  different verdicts for the same device. The parameter is the door it walks in
  through.

What the server owns is not the conversion but the facts that make it possible:
the quantity, the canonical unit, and the conversion table itself, so no
component hard-codes `9/5`. The client applies a factor it was handed; the
server never renders a preference.
