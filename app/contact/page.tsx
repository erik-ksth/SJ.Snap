export default function ContactPage() {

     const address = "200 E. Santa Clara St. San Jose, CA 95113";
     const addressLink = "https://www.google.com/maps/place/San+Jose+City+Hall/@37.337911,-121.8854785,19.94z/data=!3m1!5s0x808fcc96437b8ce9:0x56b601cb762bf21b!4m6!3m5!1s0x808fcd59348634a3:0xaa31e02c1ffc88e3!8m2!3d37.3380937!4d-121.8853892!16s%2Fm%2F03c4fgx?entry=ttu&g_ep=EgoyMDI1MDQyMy4wIKXMDSoASAFQAw%3D%3D";
     const phone1 = "408 535-3500";
     const phone1Link = "tel:+14085353500";
     const phone2 = "800 735-2922";
     const phone2Link = "tel:+18007352922";
     const website = "https://www.sanjoseca.gov/residents/report-issues";
     return (
          <div className="container mx-auto px-4 py-8">
               <h1 className="text-2xl md:text-4xl font-bold mb-6 text-center md:text-left">
                    Contact Us
               </h1>
               <div className="p-6 border rounded-lg space-y-4 md:space-y-6 md:p-8">
                    {/* <p className="text-gray-600 text-sm md:text-base mb-4">
                         This is the Contact page where users can find ways to get in touch.
                    </p> */}
                    <p className="text-gray-600">
                         <strong>Address:</strong>{" "}
                         <a
                              href={addressLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:underline hover:text-blue-500"
                         >
                              {address}
                         </a>
                    </p>
                    <p className="text-gray-600">
                         <strong>Main:</strong>{" "}
                         <a
                              href={phone1Link}
                              className="text-gray-500 hover:underline hover:text-blue-500"
                         >
                              {phone1}
                         </a>
                    </p>
                    <p className="text-gray-600">
                         <strong>Alternative:</strong>{" "}
                         <a
                              href={phone2Link}
                              className="text-gray-500 hover:underline hover:text-blue-500"
                         >
                              {phone2}
                         </a>
                    </p>
                    <p className="text-gray-600">
                         <strong>Report an Issue:</strong>{" "}
                         <a
                              href={website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:underline hover:text-blue-500"
                         >
                              www.sanjoseca.gov
                         </a>
                    </p>
               </div>
          </div>
     );
}