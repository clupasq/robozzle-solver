import axios from "axios";

const downloadLevel = async (levelNo: number): Promise<string> => {
    const response = await axios({
        method: "POST",
        url: "http://www.robozzle.com/RobozzleService.svc",
        data: `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <soap:Body>
        <GetLevel xmlns="http://tempuri.org/">
            <levelId>${levelNo}</levelId>
        </GetLevel>
    </soap:Body>
</soap:Envelope>
`,
        responseType: "text",
        headers: {
            "Content-Type": "text/xml; charset=UTF-8",
            "SOAPAction": "http://tempuri.org/IRobozzleService/GetLevel",
        }
    })

    return response.data
}

const main = async () => {
    console.log(await downloadLevel(101))
}


main()
    .then(() => console.log("Done"))
    .catch(e => console.error(e.message))

