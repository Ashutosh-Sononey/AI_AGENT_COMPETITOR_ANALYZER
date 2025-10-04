   if [ -e "/env" ]; then
        echo "Detected python virt at env/"
    else
     python3 -m venv env
    fi
source venv/bin/activate 
pip install -r requirements.txt
adk api_server --allow_origins="*" &
sleep 5
python3 serve.py & 

