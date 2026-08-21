# CV Template Feature Documentation

## Overview
The Job Portal now includes a professional CV template system with 4 different design templates that job seekers can use to create and download their resumes as PDFs.

## Features

### 1. **4 Professional Templates**
- **Modern**: Clean design with sidebar, color accents, and modern typography
- **Professional**: Classic layout suitable for traditional industries
- **Creative**: Bold, visually interesting design for creative roles
- **Minimalist**: Simple, focused design with clean whitespace

### 2. **PDF Download**
Users can download their CVs in professional PDF format with proper formatting and pagination for multi-page resumes.

### 3. **Real CV Data**
Templates render actual user data including:
- Personal information (name, title, contact, location)
- Professional summary
- Work experience with descriptions
- Education
- Skills
- Certifications

## File Structure

```
src/components/cv-templates/
├── CVTemplateSelector.tsx    # Template selection modal
├── CVTemplateRenderer.tsx    # Template rendering components
└── cv-templates.css          # All template styles

src/utils/
└── cvDownloadUtils.ts        # PDF generation utilities

src/pages/seeker/
└── ProfilePage.tsx           # Updated profile page with template integration
```

## How to Use

### For Job Seekers:
1. Go to Profile Page
2. Click "Choose Template" button
3. Browse the 4 templates
4. Click "Select" to choose a template
5. Download the CV as PDF using "Download PDF" button

### For Developers: Integrating with Form Data

Replace the `sampleCVData` in `ProfilePage.tsx` with actual form data:

```typescript
const cvData: CVData = {
  personalInfo: {
    fullName: formData.name,
    title: formData.jobTitle,
    email: formData.email,
    phone: formData.phone,
    location: formData.location,
    linkedin: formData.linkedinUrl,
  },
  summary: formData.professionalSummary,
  experience: formData.experience.map(exp => ({
    jobTitle: exp.jobTitle,
    company: exp.company,
    startDate: exp.startDate,
    endDate: exp.endDate,
    currentlyWorking: exp.currentlyWorking,
    description: exp.description,
  })),
  education: formData.education.map(edu => ({
    degree: edu.degree,
    school: edu.school,
    year: edu.graduationYear,
  })),
  skills: formData.skills,
  certifications: formData.certifications.map(cert => ({
    name: cert.name,
    issuer: cert.issuer,
  })),
};
```

## Customization

### Adding a New Template
1. Create a new function in `CVTemplateRenderer.tsx`:
```typescript
function MyCustomTemplate({ data }: { data: CVData }) {
  return (
    <div className="cv-my-custom">
      {/* Your template HTML */}
    </div>
  );
}
```

2. Add it to the switch statement in `CVTemplateRenderer`
3. Add styles to `cv-templates.css`
4. Add it to `TEMPLATES` array in `CVTemplateSelector.tsx`

### Customizing Colors
Edit the color values in `cv-templates.css`:
- Modern: Uses `#007bff` (blue) as primary color
- Professional: Uses `#2c3e50` (dark blue) as primary color
- Creative: Uses gradient from `#667eea` to `#764ba2`
- Minimalist: Uses neutral grays

## Technical Stack

- **PDF Generation**: jsPDF + html2canvas
- **React Components**: TypeScript + React
- **Styling**: CSS with print media queries
- **Icons**: react-icons/fa

## Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ⚠️ Not supported

## Future Enhancements

- [ ] Template preview before download
- [ ] Customizable colors per template
- [ ] Import data from LinkedIn
- [ ] AI-powered resume enhancement
- [ ] Export as Word document
- [ ] Cloud storage for CV versions
- [ ] CV sharing via link
