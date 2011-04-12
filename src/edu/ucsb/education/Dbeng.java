package edu.ucsb.education;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.LinkedList;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;

import edu.ucsb.education.DbengConfiguration.Database;

/**
 * Servlet implementation class Dbeng
 */
public class Dbeng extends HttpServlet {
	private static final long serialVersionUID = 1L;

	private DbengConfiguration conf;
	private HashMap<String, Connection> connections;
	private LinkedList<String> driverNames;

	public void init() {

		connections = new HashMap<String, Connection>();
		driverNames = new LinkedList<String>();

		Gson gson = new Gson();
		JsonReader reader = null;
		try {
			reader = new JsonReader(new InputStreamReader(getServletContext()
					.getResourceAsStream("/WEB-INF/dbeng.conf.js"), "UTF-8"));
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		conf = gson.fromJson(reader, DbengConfiguration.class);

		for (Database db : conf.getDatabases()) {
			if (!driverNames.contains(db.getDriver())) {
				String driver = db.getDriver();
				driverNames.add(driver);
				try {
					Class.forName(driver);
				} catch (ClassNotFoundException e) {
					log("Could not load driver `" + driver + "`");
					e.printStackTrace();
				}
			}
			try {
				connections.put(
						db.getName(),
						DriverManager.getConnection(db.getUrl(),
								db.getUsername(), db.getPassword()));
				log(connections.toString());
			} catch (SQLException e) {
				log("SQLException using driver `" + db.getDriver() + "`, url `"
						+ db.getUrl() + "`, username `" + db.getUsername()
						+ "`, password filtered");
				e.printStackTrace();
			}
		}
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		/*
		 * parse requests from JSON There can be multiple request objects, each
		 * with exactly one server and one SQL statement defined
		 */

		// Check connection status and re-establish if necessary
		// REMEMBER to set content type to UTF-8 BEFORE creating PrintWriter
	}
}
