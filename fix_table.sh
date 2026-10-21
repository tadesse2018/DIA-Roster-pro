cat << 'INNEREOF' >> src/index.css

/* Force Tables to be White with Dark Text even in Dark Mode */
.dark table:not(.marklist-printable-table):not(.roster-printable-table),
.dark table:not(.marklist-printable-table):not(.roster-printable-table) th,
.dark table:not(.marklist-printable-table):not(.roster-printable-table) td {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
}
.dark table:not(.marklist-printable-table):not(.roster-printable-table) tr:hover td {
  background-color: #f1f5f9 !important;
}
.dark table:not(.marklist-printable-table):not(.roster-printable-table) * {
  color: #0f172a !important;
}
/* Ensure buttons inside the table still look somewhat okay */
.dark table:not(.marklist-printable-table):not(.roster-printable-table) button,
.dark table:not(.marklist-printable-table):not(.roster-printable-table) a {
  border-color: #cbd5e1 !important;
}
INNEREOF

npm run build
