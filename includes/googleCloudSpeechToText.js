// Import necessary libraries and functions
const { Storage } = require('@google-cloud/storage');
const speech = require('@google-cloud/speech');
const { saveAudioAndTranscript } = require('./saveAudioAndTranscript');

// Initialize Google Cloud Storage and Speech clients.
const storage = new Storage();
const speechClient = new speech.SpeechClient();

// Create the googleCloudSpeechToText function
async function googleCloudSpeechToText(req, res) {
    try {
      const audioBlob = req.body.audio; // Assuming the blob data is in the 'audio' field of the request body
  
      if (!audioBlob) {
        console.log("No audio blob data received.");
        return res.status(400).send('No audio blob data received.');
      }
  
      // Configure the audio recognition request.
      const audioConfig = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
      };
  
      const request = {
        audio: {
          content: audioBlob.toString('base64'),
        },
        config: audioConfig,
      };
  
      // Perform speech-to-text recognition.
      const [response] = await speechClient.recognize(request);
      const transcript = response.results
        .map((result) => result.alternatives[0].transcript)
        .join('\n');
  
      // Save the audio and transcript to MySQL using the imported function.
      await saveAudioAndTranscript(audioBlob, transcript);
  
      console.log('Audio and transcript saved to MySQL.');
      res.status(200).send(transcript);
    } catch (err) {
      console.error('Error processing audio:', err);
      res.status(500).send('Error processing audio.');
    }
  }
  

module.exports = { googleCloudSpeechToText };
