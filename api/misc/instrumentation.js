require('dotenv').config();

console.log(`OTEL instrumentation using trace server  ${process.env.OTEL_TRACE_URL}`);
console.log(`OTEL instrumentation using metric server ${process.env.OTEL_METRICS_URL}`);
console.log(`OTEL service name is '${process.env.OTEL_SERVICE_NAME}'`);

const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter({
    // optional - default url is http://localhost:4318/v1/traces
    // url: process.env.OTEL_TRACE_URL,
    // optional - collection of custom headers to be sent with each request, empty by default
    headers: {},
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      // url: '<your-otlp-endpoint>/v1/metrics', // url is optional and can be omitted - default is http://localhost:4318/v1/metrics
      // url: process.env.OTEL_METRICS_URL,
      headers: {}, // an optional object containing custom headers to be sent with each request
      concurrencyLimit: 1, // an optional limit on pending requests
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
