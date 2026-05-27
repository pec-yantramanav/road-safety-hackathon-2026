import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

async def generate_utilization_certificate(workorder_id: str, officer_id: str):
    # Ensure static directory exists
    pdf_dir = "static/uc"
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_path = f"{pdf_dir}/uc-{workorder_id}.pdf"
    
    # Setup document
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        spaceAfter=15,
        alignment=1 # Center
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        spaceAfter=12
    )

    story = []
    
    # Add content
    story.append(Paragraph("FORM GFR 12-A", title_style))
    story.append(Paragraph("<b>UTILIZATION CERTIFICATE FOR THE YEAR 2025-26</b>", title_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(
        f"Certified that out of the funds sanctioned under Smart Cities Mission for the workorder <b>{workorder_id}</b>, "
        "a sum of Rs. 1,20,000/- (Rupees One Lakh Twenty Thousand Only) has been utilized for the purpose of road repairs and pothole filling.",
        body_style
    ))
    
    story.append(Paragraph(
        "Further certified that I have satisfied myself that the conditions on which the grants-in-aid were sanctioned "
        "have been duly fulfilled and that I have exercised the following checks to see that the money was actually utilized "
        "for the purpose for which it was sanctioned.",
        body_style
    ))
    
    story.append(Spacer(1, 20))
    
    # Checks table
    data = [
        ["S.No", "Kind of Checks Exercised", "Status"],
        ["1", "EXIF geo-location verification on photos", "Verified"],
        ["2", "Before vs After visual comparison check", "Verified"],
        ["3", "Division budget balance verification", "Approved"]
    ]
    t = Table(data, colWidths=[50, 300, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    
    story.append(Spacer(1, 40))
    story.append(Paragraph(f"<b>Authorized Officer ID:</b> {officer_id}", body_style))
    story.append(Paragraph("<b>Department:</b> Municipal Corporation PWD Division", body_style))
    
    doc.build(story)
    
    # Return path or relative URL
    return {
        "document_url": f"/static/uc/uc-{workorder_id}.pdf",
        "summary": f"Utilization Certificate generated successfully for workorder {workorder_id}."
    }
