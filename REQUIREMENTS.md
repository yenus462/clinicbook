# ClinicBook – Full-Stack Project Requirements

## 1. Project Goal
ClinicBook is a web-based Clinic Appointment Booking System that allows patients to find doctors, check their availability, and book appointments online. Clinic administrators manage doctors, working schedules, patients' appointments, and appointment statuses.

## 2. User Roles
### PATIENT
A registered user who can manage their profile and book clinic appointments.

### ADMIN
Clinic staff responsible for managing doctors, schedules, appointments, and statuses. Admin accounts are created by a seed script, never by public registration.

**Note:** Doctors are managed as profiles by administrators. They do not have login accounts in this project.

## 3. Patient Features
Core:
1. Register an account.
2. Log in and log out.
3. View the list of available doctors.
4. View doctor details, specialty, and description.
5. View a doctor's working days and available appointment slots.
6. Select a date and available time.
7. Book an appointment with a reason.
8. View personal appointment history and status.
9. Cancel an appointment.

Extra (after core works):
10. View and update personal profile.
11. Reschedule an appointment.

## 4. Admin Features
Core:
1. Secure admin login.
2. Add, edit, view, and deactivate/delete doctor profiles.
3. Manage specialties.
4. Set and update doctors' weekly working hours.
5. View all appointments.
6. Change appointment status (BOOKED, COMPLETED, CANCELLED).

Extra (after core works):
7. Dashboard statistics.
8. Search and filter appointments by doctor, patient, date, and status.
9. View appointment and patient details.
10. Pagination on admin lists.

## 5. Appointment Rules
1. Only registered and authenticated patients can book appointments.
2. A doctor cannot have two appointments at the same date and time.
3. A patient cannot have two active appointments at the same date and time.
4. Patients can only select available slots.
5. Each appointment lasts 30 minutes.
6. Appointments must fall within the doctor's working hours.
7. Past appointments cannot be booked.
8. Patients can book up to 30 days ahead.
9. Cancelled appointments release their time slots.
10. Patients cannot cancel or reschedule within 2 hours of the appointment.
11. Patients can only view and manage their own appointments.
12. Patients cannot set an appointment to COMPLETED. Only admins can.
13. Status rules: BOOKED can become COMPLETED or CANCELLED. COMPLETED and CANCELLED cannot return to BOOKED.
14. Rescheduling must verify availability before updating.
15. A doctor with existing appointments is deactivated instead of deleted.
16. Changing working hours must not silently break existing booked appointments.
17. All times are based on the clinic's local time zone.

## 6. Security Requirements
1. Passwords hashed with bcrypt; minimum 8 characters.
2. JWT-based authentication.
3. Role-based authorization for PATIENT and ADMIN.
4. Protected backend API routes.
5. Users cannot access another patient's private data.
6. Validate and sanitize all user input.
7. Secrets and database credentials stored in environment variables.
8. Never expose passwords or sensitive data in API responses.
9. Rate limiting on login and register routes.
10. CORS restricted to the frontend URL.
11. Security headers with Helmet.

## 7. Database Requirements
- Users
- Doctors
- Specialties
- DoctorWorkingHours
- Appointments

Use PostgreSQL and Prisma ORM. Include seed data: an admin account, sample specialties, sample doctors with working hours, and a demo patient.

## 8. Technology Stack
Frontend: React.js, CSS or Tailwind CSS, React Router, Axios
Backend: Node.js, Express.js, Prisma, JWT, bcrypt
Database: PostgreSQL
Tools: Postman, Git, GitHub, VS Code
Deployment: Vercel (frontend), Node.js host (backend), managed PostgreSQL

## 9. Non-Functional Requirements
1. Responsive design for desktop, tablet, and mobile.
2. Clear and user-friendly interface.
3. Appropriate error messages.
4. Loading indicators.
5. Reliable database operations.
6. Organized, maintainable code structure.

## 10. Out of Scope
Online payments, AI, SMS notifications, video consultations, microservices, complex hospital management, medical records and prescriptions.

## 11. Expected Final Result
A fully functional, deployed full-stack booking system with patient and admin accounts, doctor management, working schedules, appointment booking, authentication, database integration, and professional documentation.