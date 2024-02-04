import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TextInput, Button, Text, Image, Keyboard } from 'react-native';
import axios from 'axios';
import Voice from 'react-native-voice';
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';
import { RNCamera } from 'react-native-camera';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from 'react-native-text-recognition';

const URL = 'https://api.openai.com/v1/completions';

// Function for translating text
const translateText = async (text, targetLanguage) => {
  try {
    // Prepare prompt for translation API
    const prompt = `Translate the following sentence from English text to ${targetLanguage}: \n\nEnglish: ${text}\n ${targetLanguage}:`;
    // Send API request
    const response = await axios.post(
      URL,
      {
        prompt,
        max_tokens: 200,
        temperature: 0.7,
        top_p: 1.0,
        n: 1,
        stop: '\n',
        model: 'text-davinci-003',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer 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',
        },
      }
    );

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Failed:', error);
    return null;
  }
};

export default function App() {
  // State variables
  const [inputText, setInputText] = useState('');
  const [translation, setTranslation] = useState('');
  const [speechResults, setSpeechResults] = useState([]);
  const [text, setText] = useState(null);
  const [picture, setPicture] = useState(null);
  const [imageRecognitionProcess, setImageRecognitionProcess] = useState(false);

  useEffect(() => {
    // Voice recognition setup
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeALLListeners);
    };
  }, []);

  const onSpeechResults = (e) => {
    // Handle speech recognition results
    setSpeechResults(e.value);
  };

  const startListening = () => {
    // Start voice recognition
    Voice.start('en-US');
  };

  useEffect(() => {
    if (speechResults.length > 0) {
      // Set input text from speech recognition
      setInputText(speechResults[0]);
      setSpeechResults([]);
    }
  }, [speechResults]);

  const stopListening = () => {
    // Stop voice recognition
    Voice.stop();
    Keyboard.dismiss();
  };

  const handleTranslation = async () => {
    if (inputText) {
      // Translate text
      const translatedText = await translateText(inputText, 'Chinese');
      setTranslation(translatedText);
      Keyboard.dismiss();
    }
  };

  const clearRS = async () => {
    // Clear results and reset picture state
    setTranslation('');
    setInputText('');
    setPicture(null);
    setText(null);
  };

  const takePicture = () => {
    // Take a picture using the device camera
    launchCamera({ mediaType: 'photo' }, response => {
      if (!response.didCancel && !response.errorCode) {
        setPicture(response);
      }
    });
  };

  const handleTextRecognition = async () => {
    try {
      if (picture) {
        // Perform text recognition on the picture
        const result = await TextRecognition.recognize(picture.assets[0].uri);
        console.log(result);
        setText(result);
        setInputText(result.join(' '));
        setImageRecognitionProcess(false);
      }
    } catch (error) {
      console.log('Error in handleTextRecognition:', error);
    }
  };

  let cameraRef = useRef(null);

  useEffect(() => {
    // Recognize text from the picture
    const recognizeText = async () => {
      if (picture) {
        try {
          const result = await TextRecognition.recognize(picture.assets[0].uri);
          console.log(result);
          setText(result);
          setInputText(result.join(' '));
        } catch (error) {
          console.log('Error recognizing text:', error);
        }
      }
    };

    recognizeText();
  }, [picture]);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Translation App</Text>

      {/* Text Input */}
      <TextInput
        style={styles.textInput}
        placeholder="Enter text to translate"
        onChangeText={setInputText}
        value={inputText}
        multiline={true}
        textAlignVertical="top"
      />

      {/* Voice Recognition Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={startListening}>
          <Text style={styles.buttonText}>Start Listening</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleTranslation}>
          <Text style={styles.buttonText}>Translate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={stopListening}>
          <Text style={styles.buttonText}>Stop Listening</Text>
        </TouchableOpacity>
      </View>

      {/* Clear Results Button */}
      <TouchableOpacity style={styles.button} onPress={clearRS}>
        <Text style={styles.buttonText}>Clear Results</Text>
      </TouchableOpacity>

      {/* Take Picture Button */}
      <TouchableOpacity style={styles.button} onPress={takePicture}>
        <Text style={styles.buttonText}>Take Picture</Text>
      </TouchableOpacity>

      {/* Speech Results */}
      {speechResults.length > 0 &&
        speechResults.map((result, index) => <Text key={`result-${index}`}>{result}</Text>)}

      {/* Translation */}
      {translation ? <Text style={styles.translation}>{translation}</Text> : null}

      {/* Picture and Text Recognition Result */}
      {picture ? (
        <View style={styles.pictureContainer}>
          <Image source={{ uri: picture.uri }} style={styles.picture} />
          {text && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Text Recognition Result:</Text>
              <Text style={styles.resultText}>{text}</Text>
            </View>
          )}
        </View>
      ) : (
        <RNCamera
          ref={cameraRef}
          style={styles.camera}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2023 TranX. All rights reserved.</Text>
      </View>
    </GestureHandlerRootView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    marginTop: '20%',
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
  },
  textInput: {
    width: '100%',
    height: '30%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 8,
    borderRadius: 10,
  },
  translation: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 5,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
  },
  pictureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picture: {
    width: 300,
    height: 400,
    resizeMode: 'contain',
    marginTop: 16,
    marginBottom: 16,
  },
  resultContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultText: {
    marginTop: 8,
    fontSize: 16,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    backgroundColor: 'white',
    padding: 8,
    alignItems: 'center',
  },
  footerText: {
    color: 'black',
    fontSize: 12,
  },
});
